// ========================================
// REAL-TIME CLOCK
// ========================================

function updateClock() {
    const now = new Date();

    document.getElementById('current-time').innerText =
        now.toLocaleString();
}

setInterval(updateClock, 1000);
updateClock();


// ========================================
// TAB SWITCHING
// ========================================

function switchTab(tabId) {

    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.add('hidden');
    });

    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('border-cyan-600', 'text-cyan-700');
        el.classList.add('border-transparent', 'text-slate-500');
    });

    document.getElementById('tab-' + tabId).classList.remove('hidden');

    const activeBtn = document.getElementById('btn-' + tabId);

    activeBtn.classList.add('border-cyan-600', 'text-cyan-700');
    activeBtn.classList.remove('border-transparent', 'text-slate-500');

    if (tabId === 'harvest') {
        updateHarvestPanel();
    }
}


// ========================================
// DATA STORAGE
// ========================================

let feedingData = JSON.parse(
    localStorage.getItem('aquasense_feeding')
) || [
    {
        id: 1,
        date: '2026-10-15 08:30',
        type: 'Grower Pellet',
        qty: 12.5
    },
    {
        id: 2,
        date: '2026-10-16 16:00',
        type: 'Grower Pellet',
        qty: 14.0
    }
];


let growthData = JSON.parse(
    localStorage.getItem('aquasense_growth')
) || [
    {
        id: 1,
        date: '2026-09-15',
        count: 25,
        weight: 180.2,
        length: 19.5
    },
    {
        id: 2,
        date: '2026-10-01',
        count: 30,
        weight: 260.5,
        length: 23.1
    },
    {
        id: 3,
        date: '2026-10-15',
        count: 30,
        weight: 320.0,
        length: 26.4
    }
];


// ========================================
// CHART INITIALIZATION
// ========================================

let chartTempSal;
let chartPhTurb;
let chartGrowth;


function initCharts() {

    // TEMPERATURE AND SALINITY CHART

    const ctx1 = document
        .getElementById('chartTempSal')
        .getContext('2d');

    chartTempSal = new Chart(ctx1, {

        type: 'line',

        data: {

            labels: [
                '08:00',
                '10:00',
                '12:00',
                '14:00',
                '16:00',
                '18:00'
            ],

            datasets: [

                {
                    label: 'Temp (°C)',
                    data: [28.5, 29.1, 30.2, 30.8, 29.7, 29.0],
                    borderColor: '#f59e0b',
                    backgroundColor: '#f59e0b20',
                    tension: 0.3,
                    yAxisID: 'y'
                },

                {
                    label: 'Salinity (ppt)',
                    data: [22.0, 22.2, 22.5, 22.8, 22.6, 22.4],
                    borderColor: '#0d9488',
                    backgroundColor: '#0d948820',
                    tension: 0.3,
                    yAxisID: 'y1'
                }

            ]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            scales: {

                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temp (°C)'
                    }
                },

                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Salinity (ppt)'
                    }
                }

            }
        }
    });


    // PH AND TURBIDITY CHART

    const ctx2 = document
        .getElementById('chartPhTurb')
        .getContext('2d');

    chartPhTurb = new Chart(ctx2, {

        type: 'line',

        data: {

            labels: [
                '08:00',
                '10:00',
                '12:00',
                '14:00',
                '16:00',
                '18:00'
            ],

            datasets: [

                {
                    label: 'pH',
                    data: [7.8, 8.0, 8.3, 8.2, 8.1, 7.9],
                    borderColor: '#3b82f6',
                    backgroundColor: '#3b82f620',
                    tension: 0.3,
                    yAxisID: 'y'
                },

                {
                    label: 'Turbidity (NTU)',
                    data: [40, 41, 45, 44, 42, 42.5],
                    borderColor: '#06b6d4',
                    backgroundColor: '#06b6d420',
                    tension: 0.3,
                    yAxisID: 'y1'
                }

            ]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            scales: {

                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 6,
                    max: 10,
                    title: {
                        display: true,
                        text: 'pH'
                    }
                },

                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    },
                    title: {
                        display: true,
                        text: 'Turbidity (NTU)'
                    }
                }

            }
        }
    });


    // GROWTH CHART

    const ctx3 = document
        .getElementById('chartGrowth')
        .getContext('2d');

    chartGrowth = new Chart(ctx3, {

        type: 'bar',

        data: {

            labels: growthData.map(d => d.date),

            datasets: [

                {
                    label: 'Average Weight (g)',
                    data: growthData.map(d => d.weight),
                    backgroundColor: '#0891b2',
                    borderRadius: 6
                }

            ]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            scales: {

                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Weight (g)'
                    }
                }

            }
        }
    });

}


// ========================================
// AUTOMATIC ESP32 SENSOR SIMULATION
// ========================================

let simulationRunning = false;
let simulationTimer = null;

// Initial sensor values
let sensorValues = {
    temperature: 29.4,
    ph: 8.1,
    turbidity: 42.5,
    salinity: 22.8
};

// Generate realistic-looking gradual sensor changes
function generateSensorValue(current, variation, min, max) {
    const change = (Math.random() - 0.5) * variation;

    return Math.max(
        min,
        Math.min(max, current + change)
    );
}


// Update sensor cards
function updateSensorCards() {

    document.getElementById('metric-temp').innerText =
        sensorValues.temperature.toFixed(1);

    document.getElementById('metric-ph').innerText =
        sensorValues.ph.toFixed(2);

    document.getElementById('metric-turbidity').innerText =
        sensorValues.turbidity.toFixed(1);

    document.getElementById('metric-salinity').innerText =
        sensorValues.salinity.toFixed(1);
}


// Update both live graphs
function updateLiveCharts() {

    if (!chartTempSal || !chartPhTurb) return;

    // Generate new sensor readings
    sensorValues.temperature = generateSensorValue(
        sensorValues.temperature, 0.5, 27, 33
    );

    sensorValues.salinity = generateSensorValue(
        sensorValues.salinity, 0.3, 18, 30
    );

    sensorValues.ph = generateSensorValue(
        sensorValues.ph, 0.12, 7, 9
    );

    sensorValues.turbidity = generateSensorValue(
        sensorValues.turbidity, 2, 20, 70
    );

    // Current timestamp
    const time = new Date().toLocaleTimeString();

    // Update temperature and salinity graph
    chartTempSal.data.labels.push(time);

    chartTempSal.data.datasets[0].data.push(
        Number(sensorValues.temperature.toFixed(1))
    );

    chartTempSal.data.datasets[1].data.push(
        Number(sensorValues.salinity.toFixed(1))
    );


    // Update pH and turbidity graph
    chartPhTurb.data.labels.push(time);

    chartPhTurb.data.datasets[0].data.push(
        Number(sensorValues.ph.toFixed(2))
    );

    chartPhTurb.data.datasets[1].data.push(
        Number(sensorValues.turbidity.toFixed(1))
    );


    // Keep only the latest 20 readings
    const MAX_POINTS = 20;

    [chartTempSal, chartPhTurb].forEach(chart => {

        while (chart.data.labels.length > MAX_POINTS) {

            chart.data.labels.shift();

            chart.data.datasets.forEach(dataset => {
                dataset.data.shift();
            });

        }

        chart.update();

    });

    // Update dashboard metric cards
    updateSensorCards();
}


// Start automatic graph movement
function startLiveSimulation() {

    if (simulationRunning) return;

    simulationRunning = true;

    updateLiveCharts();

    simulationTimer = setInterval(() => {
        updateLiveCharts();
    }, 2000);

    document.getElementById('simulation-btn').innerText =
        'Pause Graph';
}


// Pause or resume graph movement
function toggleSimulation() {

    if (simulationRunning) {

        clearInterval(simulationTimer);

        simulationTimer = null;

        simulationRunning = false;

        document.getElementById('simulation-btn').innerText =
            'Resume Graph';

    } else {

        startLiveSimulation();

    }

}


// ========================================
// FEEDING LOG FUNCTIONS
// ========================================

function renderFeedingTable() {

    const tbody = document.getElementById('feeding-table-body');

    tbody.innerHTML = '';

    feedingData.forEach(item => {

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50">

                <td class="p-3 font-medium text-slate-700">
                    ${item.date}
                </td>

                <td class="p-3">
                    ${item.type}
                </td>

                <td class="p-3">
                    ${item.qty} kg
                </td>

                <td class="p-3 text-center">

                    <button onclick="deleteFeeding(${item.id})"
                        class="text-rose-500 hover:text-rose-700 text-xs">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            </tr>
        `;

    });

    localStorage.setItem(
        'aquasense_feeding',
        JSON.stringify(feedingData)
    );

}


function handleFeedingSubmit(e) {

    e.preventDefault();

    const date = document
        .getElementById('feed-date')
        .value.replace('T', ' ');

    const type = document.getElementById('feed-type').value;

    const qty = parseFloat(
        document.getElementById('feed-qty').value
    );

    feedingData.unshift({

        id: Date.now(),
        date: date,
        type: type,
        qty: qty

    });

    renderFeedingTable();

    document.getElementById('feeding-form').reset();

}


function deleteFeeding(id) {

    feedingData = feedingData.filter(
        item => item.id !== id
    );

    renderFeedingTable();

}


// ========================================
// GROWTH MONITORING FUNCTIONS
// ========================================

function renderGrowthTable() {

    const tbody = document.getElementById('growth-table-body');

    tbody.innerHTML = '';

    growthData.forEach(item => {

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50">

                <td class="p-3 font-medium text-slate-700">
                    ${item.date}
                </td>

                <td class="p-3">
                    ${item.count} fish
                </td>

                <td class="p-3 font-semibold text-cyan-700">
                    ${item.weight} g
                </td>

                <td class="p-3">
                    ${item.length} cm
                </td>

                <td class="p-3 text-center">

                    <button onclick="deleteGrowth(${item.id})"
                        class="text-rose-500 hover:text-rose-700 text-xs">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </td>

            </tr>
        `;

    });

    localStorage.setItem(
        'aquasense_growth',
        JSON.stringify(growthData)
    );


    if (chartGrowth) {

        chartGrowth.data.labels = growthData.map(d => d.date);

        chartGrowth.data.datasets[0].data =
            growthData.map(d => d.weight);

        chartGrowth.update();

    }

}


function handleGrowthSubmit(e) {

    e.preventDefault();

    const date = document.getElementById('growth-date').value;

    const count = parseInt(
        document.getElementById('growth-count').value
    );

    const weight = parseFloat(
        document.getElementById('growth-weight').value
    );

    const length = parseFloat(
        document.getElementById('growth-length').value
    );

    growthData.push({

        id: Date.now(),
        date: date,
        count: count,
        weight: weight,
        length: length

    });

    growthData.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    renderGrowthTable();

    document.getElementById('growth-form').reset();

}


function deleteGrowth(id) {

    growthData = growthData.filter(
        item => item.id !== id
    );

    renderGrowthTable();

}


// ========================================
// HARVEST PLANNING
// ========================================

function updateHarvestPanel() {

    const targetWeight = parseFloat(
        document.getElementById('target-weight-input').value
    ) || 350;

    const summaryDate = document.getElementById('summary-date');
    const summaryCount = document.getElementById('summary-count');
    const summaryWeight = document.getElementById('summary-weight');
    const summaryLength = document.getElementById('summary-length');

    const statusIconWrapper =
        document.getElementById('status-icon-wrapper');

    const statusIcon = document.getElementById('status-icon');

    const statusTitle = document.getElementById('status-title');

    const statusDesc =
        document.getElementById('status-description');


    if (growthData.length === 0) {

        summaryDate.innerText = '--';
        summaryCount.innerText = '--';
        summaryWeight.innerText = '-- g';
        summaryLength.innerText = '-- cm';

        statusIconWrapper.className =
            "inline-flex p-3 rounded-full bg-amber-100 text-amber-600";

        statusIcon.className =
            "fa-solid fa-hourglass-half text-2xl";

        statusTitle.innerText = "No Growth Records Found";

        statusDesc.innerText =
            "Please add sample records in the Growth Monitoring tab.";

        return;
    }


    const latest = growthData[growthData.length - 1];

    summaryDate.innerText = latest.date;
    summaryCount.innerText = latest.count;
    summaryWeight.innerText = latest.weight + ' g';
    summaryLength.innerText = latest.length + ' cm';

    const diff = targetWeight - latest.weight;


    if (latest.weight >= targetWeight) {

        statusIconWrapper.className =
            "inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600";

        statusIcon.className =
            "fa-solid fa-circle-check text-2xl";

        statusTitle.innerText =
            "Target Market Size Reached!";

        statusDesc.innerText =
            `Latest recorded average weight (${latest.weight}g) meets or exceeds your target market benchmark (${targetWeight}g). Fish are ready for harvest review.`;

    } else if (diff <= 50) {

        statusIconWrapper.className =
            "inline-flex p-3 rounded-full bg-blue-100 text-blue-600";

        statusIcon.className =
            "fa-solid fa-arrow-trend-up text-2xl";

        statusTitle.innerText =
            "Approaching Target Size";

        statusDesc.innerText =
            `Only ~${diff.toFixed(1)}g away from your target market size (${targetWeight}g). Continue monitoring feeding and water parameters closely.`;

    } else {

        statusIconWrapper.className =
            "inline-flex p-3 rounded-full bg-amber-100 text-amber-600";

        statusIcon.className =
            "fa-solid fa-clock text-2xl";

        statusTitle.innerText =
            "Below Target Size (Grow-out Phase)";

        statusDesc.innerText =
            `Current average weight is ${latest.weight}g. Approximately ${diff.toFixed(1)}g remaining to reach target market size. Continue regular feeding log cycles.`;

    }

}


// ========================================
// INITIALIZE WEBSITE
// ========================================

window.onload = function() {

    initCharts();

    renderFeedingTable();

    renderGrowthTable();

    // Start automatic sensor simulation
    startLiveSimulation();

};