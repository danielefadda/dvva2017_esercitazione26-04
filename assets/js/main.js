var width = 700,
    height = 350;

// MAP Preparation
var svg = d3.select("#viz")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// projection
var projection = d3.geo.mercator()
    .scale(150)
    .center([0, 25])
    .translate([width / 2, height / 2]);

// path transofrmer (from coordinates to path definition)
var path = d3.geo.path().projection(projection);
var gg = svg.append("g")

// first child g to contain background
var sfondo = gg.append("g")
    .append("rect")
    .attr("class", "backgroundMap")
    .attr('width', width)
    .attr('height', height)
    .style('fill', "#CEE6ED")
    //  using patterns:
    // .style("fill", "url(#whitecarbon)")
    .style("fill-opacity", 0.2);

// second child g to contain map
var g = gg.append("g")
    .attr("class", "map")
    .style("fill", "lightgray");


// DATA PREPARATION
var dsv = d3.dsv(";", "text/plain");

d3.queue()
    .defer(d3.json, "assets/data/world.geojson")
    .defer(dsv, "assets/data/opere_colori_geo.csv", function(d) {
        // filter only useful attributes:
        // ANNO_ARTWORK, ARTWORK_PLACE, ARTWORK_PLACE_LAT, ARTWORK_PLACE_LON, MUSEUM
        // TECHNIQUE, TYPE, SCHOOL

        var m = {
            // convert strings to numbers
            ANNO_ARTWORK: +d.ANNO_ARTWORK,
            ARTWORK_PLACE_LAT: +d.ARTWORK_PLACE_LAT,
            ARTWORK_PLACE_LON: +d.ARTWORK_PLACE_LON,
            BIRTH_PLACE: d.BIRTH_PLACE,
            BIRTH_LAT: +d.BIRTH_LAT,
            BIRTH_LON: +d.BIRTH_LON,
            BIRTH_PLACE_ISO2: d.BIRTH_PLACE_ISO2,
            BIRTH_PLACE_CNT: d.BIRTH_PLACE_CNT,
            ARTWORK_PLACE_ISO2: d.ARTWORK_PLACE_ISO2,
            ARTWORK_PLACE_CNT: d.ARTWORK_PLACE_CNT,

            // select only a few attributes
            ARTWORK_PLACE: d.ARTWORK_PLACE,
            MUSEUM: d.MUSEUM,
            TECHNIQUE: d.TECHNIQUE,
            TYPE: d.TYPE,
            SCHOOL: d.SCHOOL,

            // discard all the others
        }

        // return the modified row
        return m;
    })
    .await(callback);

function callback(error, mondo, opere) {
    if (error) console.log("error", error);
    json = mondo.features;


    // GROUP opere by ARTIST BIRTH PLACE
    birth_place_count = d3.nest()
        .key(function(d) {
            return d.BIRTH_PLACE_ISO2
        })
        .rollup(function(leaves) {
            return leaves.length
        })
        .map(opere);
    console.log("birth_place_count", birth_place_count);

    // GROUP artwork by ARTWORK MUSEUM PLACE
    artwork_place_count = d3.nest()
        .key(function(d) {
            return d.ARTWORK_PLACE_ISO2
        })
        .rollup(function(leaves) {
            return leaves.length
        })
        .map(opere);
    console.log("artwork_place_count", artwork_place_count);

    // draw basic map
    path = g.selectAll("path")
        .data(json.filter(function(d) {
            return d.properties.CNTR_ID != "AQ" // && d.geometry != null;
        }))
        .enter()
        .append("path")
        .attr("d", path)
        .attr('id', function(d) {
            return d.properties.CNTR_ID;
        })
        .attr('class', "stato");


}