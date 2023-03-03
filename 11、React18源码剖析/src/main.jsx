import * as React from 'react';
import { createRoot } from "react-dom/client";
function FunctionComponent() {
  console.log('FunctionComponent');
  const [number, setNumber] = React.useState(0);
  return (
    <button onClick={() => {
      setNumber((number) => number)
    }}>
      {number}
    </button>
  )
}
let element = <FunctionComponent />
const root = createRoot(document.getElementById("root"));
root.render(element);