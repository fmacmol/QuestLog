import React, { useState, useRef, useEffect } from 'react';

const DraggableCosmetic = ({ type, itemId, initialPosition, onPositionChange, onDrop }) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragRef.current.startX = e.clientX - position.x;
    dragRef.current.startY = e.clientY - position.y;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragRef.current.startX;
    const newY = e.clientY - dragRef.current.startY;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      onPositionChange(type, position);
      setIsDragging(false);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const getIcon = () => {
    if (itemId === 'sombrero') return '🤠';
    if (itemId === 'corona') return '👑';
    if (itemId === 'espada') return '🗡️';
    if (itemId === 'escudo') return '🛡️';
    return '✨';
  };

  return (
    <div
      className="absolute cursor-grab active:cursor-grabbing text-3xl drop-shadow-lg select-none"
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
      onMouseDown={handleMouseDown}
    >
      {getIcon()}
    </div>
  );
};

export default DraggableCosmetic;