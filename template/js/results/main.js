var build_values_map = function (element_id) {
    // set the dimensions and margins of the graph
    const map_margin = {top: 10, right: 30, bottom: 40, left: 60};
    const map_width = window.screen.width / 1.6 - map_margin.left - map_margin.right;
    const map_height = window.screen.height / 1.6 - map_margin.top - map_margin.bottom;

    var labelArray = []
    var anchorArray = []

    const svg = d3.select(`#${element_id}`)
        .append("svg")
        .attr("width", map_width + map_margin.left + map_margin.right)
        .attr("height", map_height + map_margin.top + map_margin.bottom)
        .append("g")
        .attr("transform", `translate(${map_margin.left}, ${map_margin.top})`);

    //Read the data
    d3.csv(document.getElementById('file-src').value).then(function (data) {
        // Add X axis
        const x = d3.scaleLinear()
            .domain([-1.13, 2.0])
            .range([0, map_width]);

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([-1.3, 2.3])
            .range([map_height, 0]);

        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", map_width / 2 + map_margin.left + 100)
            .attr("y", map_height + map_margin.top + 25)
            .attr("font-size", 18)
            .text('Survival vs. Self-expression Values ⟶')
            .style("fill", "#777");

        svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -map_margin.left + 20)
            .attr("x", -map_margin.top - map_height / 2 + 180)
            .attr("font-size", 18)
            .text('Traditional vs. Secular Values ⟶')
            .style("fill", "#777");

        var curve = d3.line().curve(d3.curveNatural);
        var colorset = {}
        var legendCounter0 = 0

        Object.keys(colorset).forEach(function (d) {
            svg.append("circle").attr("cx", map_width - 200).attr("cy", map_height - 230 + legendCounter0).attr("r", 5).style("fill", d).attr("opacity", 0.7)
            svg.append("text").attr("x", map_width - 200 + 15).attr("y", map_height - 230 + 4 + legendCounter0).text(colorset[d]).style("font-size", "14px").attr("alignment-baseline", "middle").attr("opacity", 0.7)
            legendCounter0 = legendCounter0 + 20
        })

        var color = d3.scaleOrdinal(d3.schemeCategory10);

        // Add dots
        var gdots = svg.selectAll("g.dot")
            .data(data)
            .enter().append('g');

        gdots.append("circle")
            .attr("cx", function (d) {
                return x(d.self_expression);
            })
            .attr("cy", function (d) {
                return y(d.secular);
            })
            .attr("r", function (d) {
                return 5
            })
            .attr("opacity", 0.6)
            .style("fill", d => color(d.sphere))
            .style("visibility", function (d) {
                if (d.sphere == "Language Model") {
                    return "hidden"
                }
            })

        // USA,0.3873945089524334,0.9329667409602215,English-Speaking,English-Speaking

        gdots.append("circle")
            .attr("cx", function () {
                return x("0.96")
            })
            .attr("cy", function () {
                return y("0.46")
            })
            .attr("r", function (d) {
                return 6
            })
            .attr("opacity", 1)
            .attr("stroke-width", 5)
            .attr("stroke", "red")
            .style("fill", "none")

        gdots.append("text")
            .text("You are here!")
            .attr("x", function (d) {
                return (x("0.96"));
            })
            .attr("y", function (d) {
                return (y("0.46") - 14);
            })
            .style("font-size", "15px")
            .style("fill", "red")
            .attr("text-anchor", "middle")


        gdots.append("circle")
            .attr("cx", function () {
                return x("0.75")
            })
            .attr("cy", function () {
                return y("0.65")
            })
            .attr("r", function (d) {
                return 6
            })
            .attr("opacity", 1)
            .attr("stroke-width", 5)
            .attr("stroke", "red")
            .style("fill", "orange")

        gdots.append("text")
            .text("AI is here!")
            .attr("x", function (d) {
                return (x("0.75"));
            })
            .attr("y", function (d) {
                return (y("0.65") - 14);
            })
            .style("font-size", "15px")
            .style("fill", "red")
            .attr("text-anchor", "middle")

        var nested = d3
            .nest()
            .key(function (d) {
                return d.sphere_out;
            })
            .rollup(function (d) {
                return d.map(function (v) {
                    return [x(v.self_expression), y(v.secular)];
                });
            })
            .entries(data);

        nested = nested.filter(d => d.key !== "Language Model")
        nested = nested.filter(d => d.key !== "None")


        var polys = svg.append("g")
            .attr("class", "hulls")
            .selectAll("polygon")
            .data(nested)
            .enter()
            .append('g')

        var legendCounter = 0
        nested.forEach(function (d) {
            var poly = d3.polygonHull(d.value)

            var polyp = poly
            polyp.push(polyp[0], polyp[1])

            svg
                .append('path')
                .attr('d', curve(polyp))
                .attr("opacity", 0.1)
                .attr("stroke-width", 50)
                .attr("stroke-linejoin", "round")
                .attr("fill", color(d.key))
                .attr("stroke", color(d.key));

            if (poly != null) {

                svg.append("circle").attr("cx", map_width - 200).attr("cy", map_height - 170 + legendCounter).attr("r", 5).style("fill", color(d.key)).attr("opacity", 0.7)
                svg.append("text").attr("x", map_width - 200 + 15).attr("y", map_height - 170 + 4 + legendCounter).text(d.key).style("font-size", "14px").attr("alignment-baseline", "middle").attr("opacity", 0.7)
                legendCounter = legendCounter + 20

            }
        })

        gdots.append("text")
            .text(function (d) {
                return d.country
            })
            .attr("x", function (d) {
                return (x(d.self_expression) + 7);
            })
            .attr("y", function (d) {
                return (y(d.secular) + 4);
            })
            .style("font-size", "11px")
            .style("fill", function (d) {
                if (d.sphere == "Language Model") {
                    return "#7f6b00"
                } else {
                    return "#aaa"
                }
            })
            .style("z-index", function (d) {
                if (d.sphere == "Language Model") {
                    return 10
                } else {
                    return 5
                }
            })
            .style("font-weight", function (d) {
                if (d.sphere == "Language Model") {
                    return "normal"
                } else {
                    return "normal"
                }
            });

    })
}