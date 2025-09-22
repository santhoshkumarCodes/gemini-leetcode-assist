import { FC } from "react";
import { Provider } from "react-redux";
import store from "@/state/store";
import ChatWindow from "@/components/chat/ChatWindow";

const Injection: FC = () => {
  return (
    <Provider store={store}>
      <ChatWindow />
    </Provider>
  );
};

export default Injection;
