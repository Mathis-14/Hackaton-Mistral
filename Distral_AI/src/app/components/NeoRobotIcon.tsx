"use client";

export default function NeoRobotIcon({
  width = 48,
  height = 48,
}: {
  width?: number | string;
  height?: number | string;
}) {
  return (
    <svg viewBox="0 0 16 16" width={width} height={height} shapeRendering="crispEdges">
      <rect x="7" y="1" width="2" height="1" fill="#888" />
      <rect x="8" y="0" width="1" height="1" fill="#E76E6E" />
      <rect x="5" y="2" width="6" height="5" fill="#aaa" />
      <rect x="5" y="2" width="6" height="1" fill="#888" />
      <rect x="6" y="3" width="2" height="2" fill="#0af" />
      <rect x="9" y="3" width="2" height="2" fill="#0af" />
      <rect x="7" y="4" width="1" height="1" fill="#06a" />
      <rect x="10" y="4" width="1" height="1" fill="#06a" />
      <rect x="6" y="6" width="4" height="1" fill="#555" />
      <rect x="7" y="6" width="1" height="1" fill="#89E089" />
      <rect x="9" y="6" width="1" height="1" fill="#89E089" />
      <rect x="7" y="7" width="2" height="1" fill="#777" />
      <rect x="4" y="8" width="8" height="5" fill="#999" />
      <rect x="4" y="8" width="8" height="1" fill="#777" />
      <rect x="6" y="9" width="4" height="3" fill="#333" />
      <rect x="7" y="10" width="2" height="1" fill="#ffd200" />
      <rect x="3" y="9" width="1" height="3" fill="#888" />
      <rect x="12" y="9" width="1" height="3" fill="#888" />
      <rect x="5" y="13" width="2" height="2" fill="#777" />
      <rect x="9" y="13" width="2" height="2" fill="#777" />
      <rect x="4" y="15" width="3" height="1" fill="#555" />
      <rect x="9" y="15" width="3" height="1" fill="#555" />
    </svg>
  );
}
