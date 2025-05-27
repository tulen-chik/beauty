import { useRef } from "react";

export function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  const onMouseDown = (e: React.MouseEvent) => {
    isDown = true;
    startX = e.pageX - (ref.current?.offsetLeft || 0);
    scrollLeft = ref.current?.scrollLeft || 0;
    document.body.style.userSelect = "none";
  };

  const onMouseLeave = () => {
    isDown = false;
    document.body.style.userSelect = "";
  };

  const onMouseUp = () => {
    isDown = false;
    document.body.style.userSelect = "";
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - (ref.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5; // scroll-fast
    if (ref.current) ref.current.scrollLeft = scrollLeft - walk;
  };

  return {
    ref,
    onMouseDown,
    onMouseLeave,
    onMouseUp,
    onMouseMove,
  };
}