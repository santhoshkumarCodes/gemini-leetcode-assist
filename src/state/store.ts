import { combineReducers, configureStore } from "@reduxjs/toolkit";

import chatReducer from "./slices/chatSlice";
import settingsReducer from "./slices/settingsSlice";
import uiReducer from "./slices/uiSlice";
import apiReducer from "./slices/apiSlice";

const rootReducer = combineReducers({
  chat: chatReducer,
  settings: settingsReducer,
  ui: uiReducer,
  api: apiReducer,
});

const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export default store;
