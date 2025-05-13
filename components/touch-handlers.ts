// タッチイベントを処理するためのユーティリティ関数

export const addTouchHandlers = (
  element: HTMLElement,
  onTouchStart: (e: TouchEvent) => void,
  onTouchMove: (e: TouchEvent) => void,
  onTouchEnd: (e: TouchEvent) => void,
) => {
  element.addEventListener("touchstart", onTouchStart, { passive: false })
  element.addEventListener("touchmove", onTouchMove, { passive: false })
  element.addEventListener("touchend", onTouchEnd, { passive: false })

  return () => {
    element.removeEventListener("touchstart", onTouchStart)
    element.removeEventListener("touchmove", onTouchMove)
    element.removeEventListener("touchend", onTouchEnd)
  }
}

// タッチイベントからマウスイベントのような座標を取得
export const getTouchCoordinates = (e: TouchEvent) => {
  const touch = e.touches[0] || e.changedTouches[0]
  return {
    clientX: touch.clientX,
    clientY: touch.clientY,
    pageX: touch.pageX,
    pageY: touch.pageY,
  }
}
