import React, { Component } from 'react';
import { Button, Container, Row, Form } from 'react-bootstrap';
import Axios, { AxiosRequestConfig, AxiosError } from 'axios';

export class UserInfoPage extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      foobar: 'foo',
      apiData: '',
      accessToken: '',
    };
  }

  mutateState() {
    let mutation = {};
    mutation = this.state.foobar == 'Hello World' ? { foobar: 'foo' } : { foobar: 'Hello World' };
    return this.setState(mutation);
  }

  fetchObjectData(url: string, secure?: boolean) {
    console.log('Fetching data..');
    this.setState({ apiData: 'Fetching...' });
    const p: AxiosRequestConfig = {
      method: 'GET',
      url: url,
      headers: secure ? {
        'Authorization': `Bearer ${this.state.accessToken}`
      } : {},
    }
    setTimeout(() => {
      Axios(p).then((res) => {
        console.log('Data retrieved');
        this.setState({ apiData: JSON.stringify(res.data, null, 2) });
      }).catch((err: AxiosError) => {
        this.setState({ apiData: `${err.name}: ${err.message}` });
      })
    }, 1000);
  }

  render() {
    return (
      <div className="Window">
        <h3>User Information</h3>
        <p>This page displays user information from Cognito data</p>
        <p>
          state.foo = {this.state.foobar} <br />
        </p>
        <Button onClick={() => this.mutateState()}>
          Simple state mutation
        </Button>
        <hr />
        <p>
          Data api: <br />
          {this.state.apiData}
        </p>
        <hr />
        <Form.Group controlId="tokenInput">
          <Form.Control type="email" placeholder="Enter cognito access token" value={this.state.accessToken} onChange={(e: any) => { this.setState({ accessToken: e.target.value }) }} />
        </Form.Group>

        <Button onClick={() => this.fetchObjectData('http://localhost:3002/data/object')}>
          Fetch data API
        </Button>
        &nbsp;&nbsp;
        <Button onClick={() => this.fetchObjectData('http://localhost:3002/data/array', true)}>
          Fetch data protected API
        </Button>
      </div >
    )
  }
}