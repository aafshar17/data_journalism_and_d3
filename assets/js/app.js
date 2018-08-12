// Set up chart
var svgWidth = 960;
var svgHeight = 500;
var margin = { top: 20, right: 40, bottom: 60, left: 100 };
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart, and shift the latter by left and top margins.
var svg = d3
    .select('.chart')
    .append('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

var chart = svg.append('g');

// Append a div to the body to create tooltips, assign it a class
d3.select(".chart").append("div").attr("class", "tooltip").style("opacity", 0);

// Retrieve data from CSV file and execute everything below
d3.csv("../../data/data.csv", function (err, healthData) {
    if (err) throw err;

    healthData.forEach(function (data) {
        data.poverty = +data.poverty;
        data.phys_act = +data.phys_act;
        data.child_poverty = +data.child_poverty;
    });

    // Create scale functions
    var yLinearScale = d3.scaleLinear().range([height, 0]);

    var xLinearScale = d3.scaleLinear().range([0, width]);

    // Create axis functions
    var bottomAxis = d3.axisBottom(xLinearScale);

    var leftAxis = d3.axisLeft(yLinearScale);

    // Scale the domain
    var xMin;
    var xMax;
    var yMin;
    var yMax;

    function findMinAndMax(dataColumnX) {

        xMin = d3.min(healthData, function (data) {
            return +data[dataColumnX] * 0.95;
        });

        xMax = d3.max(healthData, function (data) {
            return +data[dataColumnX] * 1.05;
        });

        yMin = d3.min(healthData, function (data) {
            return +data.phys_act * 0.98;
        });

        yMax = d3.max(healthData, function (data) {
            return +data.phys_act * 1.02;
        });
    }

    var currentAxisLabelX = "poverty";


    xLinearScale.domain([xMin, xMax]);

    yLinearScale.domain([yMin, yMax]);

    // Call findMinAndMax() with 'poverty' as default
    findMinAndMax(currentAxisLabelX);


    // Initialize tooltip 
    var toolTip = d3
        .tip()
        .attr("class", "tooltip")
        .offset([80, -60])
        .html(function (data) {
            var stateName = data.state;
            var physAct = +data.phys_act;
            var statepovInfo = +data[currentAxisLabelX];
            var typeofpovString;
            // Tooltip text depends on which axis is active/has been clicked
            if (currentAxisLabelX === "poverty") {
                typeofpovString = "Pecentage of population below poverty level: ";
            }
            else {
                typeofpovString = "Percentage of children in population below poverty level: ";
            }
            return stateName +
                "<br>" +
                typeofpovString +
                statepovInfo +
                "<br> % physically active: " +
                physAct;
        });
    // Create tooltip
    chart.call(toolTip);

    chart.selectAll("circle")
        .data(healthData)
        .enter()
        .append("circle")
        .attr("cx", function (data, index) {
            return xLinearScale(+data[currentAxisLabelX]);
        })
        .attr("cy", function (data, index) {
            return yLinearScale(data.phys_act)
        })
        .attr("r", "15")
        .attr("fill", "lightblue")
        // display tooltip on click
        .on("mouseenter", function (data) {
            toolTip.show(data);
        })
        // hide tooltip on mouseout
        .on("mouseout", function (data, index) {
            toolTip.hide(data);
        });

    // Append an SVG group for the xaxis, then display x-axis 
    chart
        .append("g")
        .attr('transform', `translate(0, ${height})`)
        .call(bottomAxis);

    // Append a group for y-axis, then display it
    chart.append("g").call(leftAxis);

    // Append y-axis label
    chart
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 40)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .attr("class", "axis-text")
        .attr("data-axis-name", "percentage_physically_active")
        .text("Physically Active (%)")

    // Append x-axis labels
    chart
        .append("text")
        .attr(
            "transform",
            "translate(" + width / 2 + " ," + (height + margin.top + 20) + ")"
        )
        // This axis label is active by default
        .attr("class", "axis-text active")
        .attr("data-axis-name", "poverty")
        .text("In Poverty (%)");

    chart
        .append("text")
        .attr(
            "transform",
            "translate(" + width / 2 + " ," + (height + margin.top + 45) + ")"
        )
        // This axis label is inactive by default
        .attr("class", "axis-text inactive")
        .attr("data-axis-name", "child_poverty")
        .text("Children in poverty (%)");

    // Change an axis's status from inactive to active when clicked (if it was inactive)
    // Change the status of all active axes to inactive otherwise
    function labelChange(clickedAxis) {
        d3
            .selectAll(".axis-text")
            .filter(".active")
            // An alternative to .attr("class", <className>) method. Used to toggle classes.
            .classed("active", false)
            .classed("inactive", true);

        clickedAxis.classed("inactive", false).classed("active", true);
    }

    d3.selectAll(".axis-text").on("click", function () {
        // Assign a variable to current axis
        var clickedSelection = d3.select(this);
        // "true" or "false" based on whether the axis is currently selected
        var isClickedSelectionInactive = clickedSelection.classed("inactive");
        // console.log("this axis is inactive", isClickedSelectionInactive)
        // Grab the data-attribute of the axis and assign it to a variable
        // e.g. if data-axisName is "poverty," var clickedAxis = "poverty"
        var clickedAxis = clickedSelection.attr("data-axis-name");
        console.log("current axis: ", clickedAxis);

        // The onclick events below take place only if the x-axis is inactive
        // Clicking on an already active axis will therefore do nothing
        if (isClickedSelectionInactive) {
            // Assign the clicked axis to the variable currentAxisLabelX
            currentAxisLabelX = clickedAxis;
            // Call findMinAndMax() to define the min and max domain values.
            findMinAndMax(currentAxisLabelX);
            // Set the domain for the x-axis
            xLinearScale.domain([xMin, xMax]);
            // Create a transition effect for the x-axis
            svg
                .select(".x-axis")
                .transition()
                // .ease(d3.easeElastic)
                .duration(1800)
                .call(bottomAxis);
            // Select all circles to create a transition effect, then relocate its horizontal location
            // based on the new axis that was selected/clicked
            d3.selectAll("circle").each(function () {
                d3
                    .select(this)
                    .transition()
                    // .ease(d3.easeBounce)
                    .attr("cx", function (data) {
                        return xLinearScale(+data[currentAxisLabelX]);
                    })
                    .duration(1800);
            });

            // Change the status of the axes. See above for more info on this function.
            labelChange(clickedSelection);
        }
    });
});


