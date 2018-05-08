const { resolve } = require('mutant')

const DAY = 24 * 60 * 60 * 1000

module.exports = function chartConfig ({ context }) {
  const { lower, upper } = resolve(context.range)

  // Ticktack Primary color:'hsla(215, 57%, 43%, 1)',
  const barColor = 'hsla(215, 57%, 60%, 1)'

  return {
    type: 'bar',
    data: {
      datasets: [{
        backgroundColor: barColor,
        borderColor: barColor,
        data: []
      }]
    },
    options: {
      legend: {
        display: false
      },
      scales: {
        xAxes: [{
          type: 'time',
          distribution: 'linear',
          time: {
            unit: 'day',
            min: lower,
            max: upper,
            tooltipFormat: 'MMMM D',
            stepSize: 7
          },
          bounds: 'ticks',
          ticks: {
            // maxTicksLimit: 4
          },
          gridLines: {
            display: false
          },
          maxBarThickness: 20
        }],

        yAxes: [{
          ticks: {
            min: 0,
            suggestedMax: 10,
            // max: Math.max(localMax, 10),
            stepSize: 5
          }
        }]
      },
      animation: {
        // duration: 300
      }
    }
  }
}
