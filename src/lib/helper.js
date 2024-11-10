import { Typography } from "@mui/joy";
import React from "react";

export function generateDataPoints(input) {
  const { x, y } = input;
  const result = [];

  const numPoints = Math.max(x.length, y.length);

  for (let i = 0; i < numPoints; i++) {
    const xValue = x[i % x.length];
    const yValue = y[i % y.length];

    const dataPoint = {
      x: xValue,
      y: yValue,
    };

    result.push(dataPoint);
  }

  return result;
}

export function convertTalkTimeToPercentage(input) {
  const { total_talk_time, agent, customer } = input;
  // Calculate percentages
  const agentPercentage = (agent / total_talk_time) * 100;
  const customerPercentage = (customer / total_talk_time) * 100;

  // Round percentages to one decimal place
  const roundedAgentPercentage = Math.round(agentPercentage * 10) / 10;
  const roundedCustomerPercentage = Math.round(customerPercentage * 10) / 10;

  // Create the output array
  const talkTimeData = [
    { name: "Agent", value: roundedAgentPercentage },
    { name: "Customer", value: roundedCustomerPercentage },
  ];

  return talkTimeData;
}

export const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Generates data for a sanity chart based on talktime and sentiment information.
 * @param {Object} talktime - Object containing talktime data.
 * @param {Object} sentiment - Object containing sentiment data.
 * @return {Object} Formatted data for the sanity chart.
 */

export function generateSanityChartData(talktime, sentiment) {
  // Calculate percentages

  // const agentTime = talktime.agent;
  // const customerTime = talktime.customer;

  // function calculatePosiNegTimes(timePoints, sentimentPoints, totalTime) {
  //   let positiveTime = 0;
  //   let negativeTime = 0;
  //   const coveredTime = timePoints[timePoints.length - 1] - timePoints[0];

  //   for (let i = 1; i < timePoints.length; i++) {
  //     const duration = timePoints[i] - timePoints[i - 1];
  //     const avgSentiment = (sentimentPoints[i - 1] + sentimentPoints[i]) / 2;

  //     if (avgSentiment >= 1) {
  //       positiveTime += duration;
  //     } else {
  //       negativeTime += duration;
  //     }
  //   }

  //   // Extrapolate to total time
  //   const ratio = totalTime / coveredTime;
  //   return {
  //     positiveTime: positiveTime * ratio,
  //     negativeTime: negativeTime * ratio,
  //   };
  // }

  // const agentTimes = calculatePosiNegTimes(
  //   sentiment.chart_data.agent.x,
  //   sentiment.chart_data.agent.y,
  //   agentTime
  // );
  // const customerTimes = calculatePosiNegTimes(
  //   sentiment.chart_data.customer.x,
  //   sentiment.chart_data.customer.y,
  //   customerTime
  // );

  // const totalTime = agentTime + customerTime;

  // return {
  //   links: [
  //     {
  //       source: 0,
  //       target: 2,
  //       value: Math.round((agentTimes.positiveTime / totalTime) * 100),
  //     },
  //     {
  //       source: 0,
  //       target: 3,
  //       value: Math.round((agentTimes.negativeTime / totalTime) * 100),
  //     },
  //     {
  //       source: 1,
  //       target: 2,
  //       value: Math.round((customerTimes.positiveTime / totalTime) * 100),
  //     },
  //     {
  //       source: 1,
  //       target: 3,
  //       value: Math.round((customerTimes.negativeTime / totalTime) * 100),
  //     },
  //   ],
  // };

  // Separation

  if (!talktime || !sentiment || !sentiment.chart_data) {
    throw new Error("Missing required data.");
  }
  const agentTime = talktime.agent ? talktime.agent : 0;
  const customerTime = talktime.customer ? talktime.customer : 0;

  function calculateSentimentTimes(timePoints, sentimentPoints, totalTime) {
    if (
      !timePoints ||
      !sentimentPoints ||
      timePoints.length === 0 ||
      sentimentPoints.length === 0
    ) {
      return { negativeTime: 0, neutralTime: 0, positiveTime: 0 };
    }

    let negativeTime = 0;
    let neutralTime = 0;
    let positiveTime = 0;
    const coveredTime = timePoints[timePoints.length - 1] - timePoints[0];

    for (let i = 1; i < timePoints.length; i++) {
      const duration = timePoints[i] - timePoints[i - 1];
      const avgSentiment =
        (sentimentPoints[i - 1] + (sentimentPoints[i] || 0)) / 2;

      if (avgSentiment < 0) {
        negativeTime += duration;
      } else if (avgSentiment >= 0 && avgSentiment <= 2) {
        neutralTime += duration;
      } else {
        positiveTime += duration;
      }
    }

    // Extrapolate to total time
    const ratio = totalTime / coveredTime;
    return {
      negativeTime: negativeTime * ratio,
      neutralTime: neutralTime * ratio,
      positiveTime: positiveTime * ratio,
    };
  }

  const agentTimes = calculateSentimentTimes(
    sentiment.chart_data.agent?.x ? sentiment.chart_data.agent.x : [],
    sentiment.chart_data.agent?.y ? sentiment.chart_data.agent.y : [],
    agentTime
  );
  const customerTimes = calculateSentimentTimes(
    sentiment.chart_data.customer?.x ? sentiment.chart_data.customer.x : [],
    sentiment.chart_data.customer?.y ? sentiment.chart_data.customer.y : [],
    customerTime
  );

  const totalTime = agentTime + customerTime;

  // Calculate percentages
  let links = [
    {
      source: 0,
      target: 2,
      value: Math.max(
        1,
        Math.round((agentTimes.positiveTime / totalTime) * 100)
      ),
    },
    {
      source: 0,
      target: 3,
      value: Math.max(
        1,
        Math.round((agentTimes.neutralTime / totalTime) * 100)
      ),
    },
    {
      source: 0,
      target: 4,
      value: Math.max(
        1,
        Math.round((agentTimes.negativeTime / totalTime) * 100)
      ),
    },
    {
      source: 1,
      target: 2,
      value: Math.max(
        1,
        Math.round((customerTimes.positiveTime / totalTime) * 100)
      ),
    },
    {
      source: 1,
      target: 3,
      value: Math.max(
        1,
        Math.round((customerTimes.neutralTime / totalTime) * 100)
      ),
    },
    {
      source: 1,
      target: 4,
      value: Math.max(
        1,
        Math.round((customerTimes.negativeTime / totalTime) * 100)
      ),
    },
  ];

  // Ensure the total of all values is 100
  const totalValue = links.reduce((sum, link) => sum + link.value, 0);
  if (totalValue !== 100) {
    const scaleFactor = 100 / totalValue;
    links = links.map((link) => ({
      ...link,
      value: Math.round(link.value * scaleFactor),
    }));
  }

  return { links };
}

export function formatDuration(ms) {
  // Calculate total seconds, minutes, and hours from milliseconds
  let seconds = Math.floor(ms / 1000); // Convert milliseconds to seconds
  let minutes = Math.floor(seconds / 60); // Convert seconds to minutes
  let hours = Math.floor(minutes / 60); // Convert minutes to hours

  // Calculate remaining seconds and minutes after extracting full hours and minutes
  seconds = seconds % 60; // Remaining seconds after full minutes
  minutes = minutes % 60; // Remaining minutes after full hours

  // Build the result string
  let result = [];
  if (hours > 0) {
    result.push(hours + "h"); // Add hours to the result if greater than 0
  }
  if (minutes > 0) {
    result.push(minutes + "m"); // Add minutes to the result if greater than 0
  }
  if (seconds > 0) {
    result.push(seconds + "s"); // Add seconds to the result if greater than 0
  }

  // Join the array into a string with spaces
  return result.join(" ");
}

export const truncateFilename = (filename, maxLength) => {
  if (filename.length > maxLength) {
    return `${filename.substring(0, maxLength)}...`;
  }
  return filename;
};

export function formatTextForDetection(text) {
  const formattedText = text.split("\n\n").map((paragraph, index) => (
    <React.Fragment key={index}>
      <Typography level="" text="primary">
        {paragraph.trim()}
      </Typography>
      {index < text.split("\n\n").length - 1 && <br />}
    </React.Fragment>
  ));

  return formattedText;
}

export function formatTextForOutComeDetection(text) {
  const formattedText = text.split("\n").map((paragraph, index) => (
    <React.Fragment key={index}>
      <Typography level="" text="primary">
        {paragraph.trim()}
      </Typography>
      {index < text.split("\n\n").length - 1 && <br />}
    </React.Fragment>
  ));

  return formattedText;
}

export function formatTextForNextItemDetection(text) {
  // const paragraphs = text.split("\n\n");

  // return paragraphs.map((paragraph, index) => {
  //   // Check if the paragraph starts with a number followed by a dot
  //   const isNumberedList = /^\d+\./.test(paragraph.trim());

  //   if (isNumberedList) {
  //     // Split the numbered list into items
  //     const listItems = paragraph.split(/\d+\.\s/).filter(item => item.trim() !== '');

  //     return (
  //       <React.Fragment key={index}>
  //         <Typography component="ol" sx={{ paddingLeft: 3 }}>
  //           {listItems.map((item, itemIndex) => (
  //             <Typography component="li" key={itemIndex} sx={{ marginBottom: 1 }}>
  //               {item.trim()}
  //             </Typography>
  //           ))}
  //         </Typography>
  //         {index < paragraphs.length - 1 && <br />}
  //       </React.Fragment>
  //     );
  //   } else {
  //     return (
  //       <React.Fragment key={index}>
  //         <Typography>
  //           {paragraph.trim()}
  //         </Typography>
  //         {index < paragraphs.length - 1 && <br />}
  //       </React.Fragment>
  //     );
  //   }
  // });

  const points = text.split(/\d+\./).filter((point) => point.trim() !== "");

  return (
    <div>
      {points.map((point, index) => (
        <Typography
          key={index}
          component="div"
          sx={{
            marginBottom: 2,
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          <Typography
            component="span"
            sx={{
              fontWeight: "bold",
              marginRight: 1,
              minWidth: "25px",
            }}
          >
            {index + 1}.
          </Typography>
          <Typography component="span">{point.trim()}</Typography>
        </Typography>
      ))}
    </div>
  );
}
