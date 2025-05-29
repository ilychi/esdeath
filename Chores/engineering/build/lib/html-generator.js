/* 工具提示 */
.tooltip {
  position: relative;
}

.tooltip-content {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-0.25rem);
  padding: 0.35rem 0.5rem;
  border-radius: 0.25rem;
  background-color: #111827;
  color: white;
  font-size: 0.75rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 50;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  right: auto; /* 确保right不干扰定位 */
  max-width: none;
}

.tooltip:hover .tooltip-content {
  opacity: 1;
  transform: translateX(-50%) translateY(-0.5rem);
}

/* 当tooltip靠近右侧边缘时自动调整位置 */
@media (max-width: 768px) {
  .tree-file-actions .tooltip-content {
    left: auto;
    right: 0;
    transform: translateY(-0.25rem);
  }
  
  .tree-file-actions .tooltip:hover .tooltip-content {
    transform: translateY(-0.5rem);
  }
} 
