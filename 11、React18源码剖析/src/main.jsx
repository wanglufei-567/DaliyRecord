import * as React from 'react';
import { createRoot } from 'react-dom/client';

function FunctionComponent() {
  const [number, setNumber] = React.useState(0);
  return number === 0 ? (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A" id="A">
        A
      </li>
      <li key="B" id="B">
        B
      </li>
      <li key="C" id="C">
        C
      </li>
    </ul>
  ) : (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A" id="A2">
        A2
      </li>
      <p key="B" id="B">
        B
      </p>
    </ul>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById('root'));
root.render(element);
