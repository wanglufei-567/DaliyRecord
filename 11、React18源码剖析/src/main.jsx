import { createRoot } from 'react-dom/client';

// let element = (
//   <h1>
//     hello<span style={{ color: "red" }}>world</span>
//   </h1>
// )

function FunctionComponent() {
  // hooks 用到更新 更新需要有事件触发
  return (
    <h1
      onClick={event => console.log(`ParentBubble`)}
      onClickCapture={event => {
        console.log(`ParentCapture`);
        // event.stopPropagation();
      }}
    >
      <span
        onClick={event => {
          console.log(`ChildBubble`);
          event.stopPropagation();
        }}
        onClickCapture={event => console.log(`ChildCapture`)}
      >
        world
      </span>
    </h1>
  );
}

let element = <FunctionComponent />;
// console.log('element', element);

// 创建root
const root = createRoot(document.getElementById('root'));
// console.log('root', root);
//把element虚拟DOM渲染到容器中
root.render(element);
