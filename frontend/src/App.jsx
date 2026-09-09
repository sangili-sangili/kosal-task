import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { CrmProvider } from './context/CrmContext';
import AppRoutes from './routes/AppRoutes';
import ToastContainer from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <CrmProvider>
          <BrowserRouter>
            <AppRoutes />
            <ToastContainer />
          </BrowserRouter>
        </CrmProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
