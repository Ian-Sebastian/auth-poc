import React from 'react';
import './App.css';
import { Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Layout } from './components/Layout';
import { UserInfoPage } from './pages/UserInfoPage';
import { HomePage } from './pages/HomePage';

const App: React.FC = () => {
  return (
    <Layout className='App'>
      <Navigation loggedIn></Navigation>
      <Route exact path='/' component={HomePage} />
      <Route exact path='/user' component={UserInfoPage} />
    </Layout>
  );
}

export default App;
