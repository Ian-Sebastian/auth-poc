import Axios, { AxiosRequestConfig } from 'axios';
import { Injectable } from '@nestjs/common';
import { config } from '../../config';
import * as qs from 'querystring';
import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';
import {
  CognitoUserPool,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUser,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import {
  AdminCreateUserRequest,
  AdminInitiateAuthRequest,
  AdminRespondToAuthChallengeRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider';

interface IUserEntity {
  name?: string;
  email: string;
  password: string;
}
@Injectable()
export class AuthService {
  protected cognitoUserPool: CognitoUserPool;
  protected cognitoApiService: AWS.CognitoIdentityServiceProvider;

  constructor() {
    AWS.config.region = config.aws.aws_project_region;
    AWS.config.accessKeyId = config.iam.aws_access_key_id;
    AWS.config.secretAccessKey = config.iam.aws_access_key_secret;
    const poolData = {
      UserPoolId: config.cognito.poolId,
      ClientId: config.cognito.clientIdNodeSDK,
    };
    this.cognitoUserPool = new CognitoUserPool(poolData); // Uses JS SDK approach
    this.cognitoApiService = new AWS.CognitoIdentityServiceProvider(); // Uses AWS SDK approach
  }
  /**
   * Can be usefull for access delegation to external users.
   * It relies in Cognito's web UI for login (which delivers the code)
   * A custom app client id could come in handy here to deliver
   * custom scopes that allow third party granular access.
   */
  async awsCallTokenEndpoint(grantType: string, code: string) {
    const data = {
      grant_type: grantType,
      client_id: config.cognito.clientIdWebUI,
      code,
      scope: 'profile',
      redirect_uri: config.cognito.redirectUri,
    };

    const p: AxiosRequestConfig = {
      method: 'POST',
      url: `${config.cognito.domainUrl}/oauth2/token`,
      data: qs.stringify(data),
      auth: {
        username: config.cognito.clientIdWebUI,
        password: config.cognito.clientSecretWebUI,
      },
    };

    console.debug(`AWS oauth2/token request parameters: ${JSON.stringify(p)}`);

    const awsResponse = await Axios(p);
    return awsResponse.data;
  }

  /**
   * For a passwordless approach to the login you must
   * put lambda triggers in position.
   *
   * REQUIRES: LAMBDA TRIGGERS
   */
  async awsCognitoLoginPasswordless(username: string) {
    const userData = {
      username,
      pool: config.cognito.poolId,
    };

    // initiateAuth
    const identityServiceProvider: AWS.CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    const params: AWS.CognitoIdentityServiceProvider.InitiateAuthRequest = {
      AuthFlow: '',
      AuthParameters: {
        USERNAME: username,
        SECRET_HASH: (() => {
          return crypto
            .createHmac('SHA256', config.cognito.clientSecretNodeSDK)
            .update(username + config.cognito.clientIdNodeSDK)
            .digest('base64');
        })(),
      },
      ClientId: config.cognito.clientIdNodeSDK,
    };

    const userNoPassword = await identityServiceProvider
      .initiateAuth(params)
      .promise();

    console.log(userNoPassword);

    return username;
  }

  /**
   * This method uses `amazon-cognito-identity-js`, which
   * is meant to be an sdk library for usage on frontend.
   * However, it sits here for reference purposes.
   *
   * Needs two roundtrips if email is not confirmed.
   */
  sdkCognitoLogin(user: IUserEntity) {
    const authDetails = new AuthenticationDetails({
      Username: user.email,
      Password: user.password,
    });

    const userData = {
      Username: user.email,
      Pool: this.cognitoUserPool,
    };

    const cognitoUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess(session: CognitoUserSession) {
          const tokens = {
            accessToken: session.getAccessToken().getJwtToken(),
            idToken: session.getIdToken().getJwtToken(),
            refreshToken: session.getRefreshToken().getToken(),
          };
          return resolve(tokens);
        },
        onFailure(err) {
          console.error('Error logged:', JSON.stringify({ err }, null, 2));
          return reject(err);
        },
        newPasswordRequired(userAttributes) {
          console.log(
            'userAttributes',
            JSON.stringify({ userAttributes }, null, 2),
          );
          delete userAttributes.email_verified;
          cognitoUser.completeNewPasswordChallenge(
            user.password,
            userAttributes,
            this,
          );
          return resolve('User Validated (insecurely!)');
        },
      });
    });
  }

  /**
   * This method uses `amazon-cognito-identity-js`, which
   * is meant to be an sdk library for usage on frontend.
   * However, it sits here for reference purposes.
   */
  sdkCognitoRegisterUser(newUser: IUserEntity) {
    const attributeList = [];
    attributeList.push(
      new CognitoUserAttribute({ Name: 'name', Value: newUser.name }),
    );
    attributeList.push(
      new CognitoUserAttribute({ Name: 'email', Value: newUser.email }),
    );
    attributeList.push(
      new CognitoUserAttribute({ Name: 'birthdate', Value: '26-08-1994' }),
    );

    console.log(
      'Attributes Loaded: ',
      JSON.stringify({ attributeList }, null, 2),
    );

    return new Promise((resolve, reject) => {
      this.cognitoUserPool.signUp(
        newUser.email,
        newUser.password,
        attributeList,
        null,
        (err, result) => {
          if (err) {
            console.error('Error logged:', JSON.stringify({ err }, null, 2));
            return reject(err);
          }
          const cognitoUser = result.user;
          return resolve(cognitoUser);
        },
      );
    });
  }

  /**
   * This method needs AWS Cognito Admin permissions
   * to execute. These can be associated with a Service
   * IAM Role on deployment or in env vars whitin
   * localhost (or in ~/.aws/credentials file)
   */
  awsCognitoRegisterUser(newUser: IUserEntity) {
    const params: AdminCreateUserRequest = {
      UserPoolId: config.cognito.poolId,
      Username: newUser.email,
      MessageAction: 'SUPPRESS',
      TemporaryPassword: newUser.password,
      UserAttributes: [
        { Name: 'name', Value: newUser.name },
        { Name: 'email', Value: newUser.email },
        { Name: 'email_verified', Value: 'true' },
      ],
    };
    return this.cognitoApiService
      .adminCreateUser(params)
      .promise()
      .then(data => {
        console.log(
          'adminCreateUser API data: ',
          JSON.stringify({ data }, null, 2),
        );
        const initAuthParams: AdminInitiateAuthRequest = {
          AuthFlow: 'ADMIN_NO_SRP_AUTH',
          ClientId: config.cognito.clientIdNodeSDK,
          UserPoolId: config.cognito.poolId,
          AuthParameters: {
            USERNAME: newUser.email,
            PASSWORD: newUser.password,
          },
        };
        return this.cognitoApiService
          .adminInitiateAuth(initAuthParams)
          .promise();
      })
      .then(data => {
        console.log(
          'adminInitiateAuth API data: ',
          JSON.stringify({ data }, null, 2),
        );
        const challengeResponse = {
          USERNAME: newUser.email,
          NEW_PASSWORD: newUser.password,
        };

        const challengeResponseParams: AdminRespondToAuthChallengeRequest = {
          ChallengeName: 'NEW_PASSWORD_REQUIRED',
          ClientId: config.cognito.clientIdNodeSDK,
          UserPoolId: config.cognito.poolId,
          ChallengeResponses: challengeResponse,
          Session: data.Session,
        };

        return this.cognitoApiService
          .adminRespondToAuthChallenge(challengeResponseParams)
          .promise();
      })
      .catch(err => {
        console.error('Error logged:', JSON.stringify({ err }, null, 2));
        throw err;
      });
  }

  awsCognitoLogin(user: IUserEntity) {
    // const initAuthParams: AdminInitiateAuthRequest = {};
  }
}
