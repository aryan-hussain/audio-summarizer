import { generateSanityChartData } from "@/lib/helper";
import React from "react";
import { Sankey, Rectangle, Layer, Label } from "recharts";

const WhoTalksMoreChart = ({ talkTime, sentiment }) => {
  const colors = {
    "Agent Talks More": "#134B70",
    "Cust. Talks More": "#508C9B",
    Positive: "#134B70",
    Neutral: "#ff7f50",
    Negative: "#508C9B",
  };

  const nodes = [
    { name: "Agent Talks More" },
    { name: "Cust. Talks More" },
    { name: "Positive" },
    { name: "Neutral" },
    { name: "Negative" },
  ];

  const links = generateSanityChartData(talkTime, sentiment);
  
  const data = {
    nodes: nodes,
    links: links?.links,
  };

  

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto border border-solid border-[#ddd] ">
      <h2 className="text-3xl font-bold mb-2 text-primary">Who Talks More</h2>
      <p className="text-lg mb-6 text-primary">
        and how does it impact customer sentiment
      </p>

      <div className="h-80">
        {/* {if(data.links)} */}
        <Sankey
          width={500}
          height={300}
          data={data}
          node={<CustomNode colors={colors} />}
          link={<CustomLink />}
          nodePadding={50}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Layer>
            <rect x={0} y={0} width={500} height={300} fill="#f3f4f6" />
          </Layer>
        </Sankey>
      </div>
    </div>
  );
};

const CustomNode = ({ x, y, width, height, index, payload, colors }) => {
  const isLeft = x < 250;
  const textAnchor = isLeft ? "start" : "end";
  const labelX = isLeft ? x - -18 : x + width - 18;

  return (
    <g>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={colors[payload.name]}
        fillOpacity={1}
      />
      <text
        x={labelX}
        y={y + height / 2}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fill="#000000"
        fontSize={14}
      >
        {payload.name}
      </text>
    </g>
  );
};

const CustomLink = (props) => {
  const {
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    index,
  } = props;
  const gradientId = `linkGradient${index}`;

  return (
    <Layer key={index}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e5e7eb" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#e5e7eb" stopOpacity={0.2} />
        </linearGradient>
      </defs>
      <path
        d={`
          M${sourceX},${sourceY + linkWidth / 2}
          C${sourceControlX},${sourceY + linkWidth / 2}
           ${targetControlX},${targetY + linkWidth / 2}
           ${targetX},${targetY + linkWidth / 2}
          L${targetX},${targetY - linkWidth / 2}
          C${targetControlX},${targetY - linkWidth / 2}
           ${sourceControlX},${sourceY - linkWidth / 2}
           ${sourceX},${sourceY - linkWidth / 2}
          Z
        `}
        fill={`url(#${gradientId})`}
        strokeWidth="0"
      />
    </Layer>
  );
};

export default WhoTalksMoreChart;
