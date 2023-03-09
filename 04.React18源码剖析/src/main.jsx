import * as React from 'react';
import { createRoot } from 'react-dom/client';

let counter = 0;
let timer;
let bCounter = 0;
let cCounter = 0;
function FunctionComponent() {
  const [text, setText] = React.useState('A');
  const divRef = React.useRef();
  const updateB = text => text + 'B';
  updateB.id = 'updateB' + bCounter++;

  const updateC = text => text + 'C';
  updateC.id = 'updateC' + cCounter++;

  React.useEffect(() => {
    timer = setInterval(() => {
      if (counter === 0) {
        console.log('updateB');
        setText(updateB); //16
      }
      divRef.current.click(); //1
      if (counter++ > 5) {
        clearInterval(timer);
      }
    });
  }, []);
  return (
    <div
      ref={divRef}
      onClick={() => {
        console.log('updateC');
        setText(updateC);
      }}
    >
      <span>{text}</span>
    </div>
  );
}
let element = <FunctionComponent />;
const root = createRoot(document.getElementById('root'));
root.render(element);
