import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from '@/state/store';
import './index.css';
import Popup from '@/pages/popup/Popup'; // Import Popup directly

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <Popup />
    </Provider>
  </StrictMode>,
);
