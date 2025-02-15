import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import store from './store'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App'
import { GoogleOAuthProvider } from '@react-oauth/google';


ReactDOM.render(
  <Provider store={store}>
    <GoogleOAuthProvider clientId="1007321245759-69bvdu1hc8eikrc5fd5jhufpu5fo8vqi.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </Provider>,
  document.getElementById('root')
)

