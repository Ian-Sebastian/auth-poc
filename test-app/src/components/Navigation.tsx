import React from 'react';
import { Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import * as qs from 'querystring';

export function Navigation(props: any) {
  console.log(props);
  return (
    <Navbar bg="dark" variant="dark">
      <Navbar.Brand href="/">
        <img
          alt=""
          src="/logo192.png"
          width="30"
          height="30"
          className="d-inline-block align-top"
        />
        {' 616 '}
      </Navbar.Brand>

      <Navbar.Collapse className="justify-content-end">
        <Navbar.Text>
          <a href="https://gigs-finder-test-app.auth.us-east-1.amazoncognito.com/login?response_type=code&client_id=4f8o8lhsa71v5ovbbi4o8gl5li&redirect_uri=http://localhost:3001/auth/callback">
            Login
          </a>
        </Navbar.Text>
        {/* <Navbar.Text>
          Signed in as: <a href="/user">John Doe</a>
        </Navbar.Text> */}
      </Navbar.Collapse>
    </Navbar>
  )
}