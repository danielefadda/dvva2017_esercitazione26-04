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

// COLOR SCALE
// color scale Birth Place gray
var birthPlaceColor = d3.scale.quantile()
    .range(colorbrewer.Oranges[9]);
// color scale Artwork Place orange
var artworkPlaceColor = d3.scale.quantile()
    .range(colorbrewer.Greys[9]);

// HANDLER
var attributesHandler = {
    "birthPlace": {
        value: "birthPlace",
        label: "birth place",
         colorScale: birthPlaceColor,
        valueSelector: function(d) {
            return birthPlaceColor(birth_place_count[d.properties.CNTR_ID] || 0); // se indefinito assegna ZERO
        },
        title:"Artist by country",
        description:"Number of artists born in each country"
    },
    "artworkPlace": {
        value: "artworkPlace",
        label: "artwork place",
        colorScale: artworkPlaceColor,
        valueSelector: function(d) {
            return artworkPlaceColor(artwork_place_count[d.properties.CNTR_ID] || 0); // se indefinito assegna ZERO
        },
        title:"Artwork by country",
        description:"Number of artwork in each country"
    }
};


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

    // SET DOMAINS FOR COLOR SCALES
    // set domain for birthPlace;
    birthPlaceColor.domain(d3.values(birth_place_count));
    // set domain for artworkPlace;
    artworkPlaceColor.domain(d3.values(artwork_place_count));

    // functions must be called into callback to use data!!!
    changeMapColor('birthPlace');


}


//// MAIN FUNCTION TO CONTROL MAP
function changeMapColor(selection) {
    console.log('selection', selection);
    var handler = attributesHandler[selection];
    updateMapColors(handler.colorScale, handler.valueSelector);
    
    //Change Title Map
    d3.select("#titleMap")
    .text(handler.title)
    //Change Map Legend
    d3.select("#mapDescription")
    .text(handler.description)
}


function updateMapColors(colorScale, valSel) {
    svg.selectAll("path.stato")
        .transition()
        .duration(1500)
        .attr("fill", valSel)
        //added function to handler!!!
        
        // EXAMPLE:
        // colorScale: artworkPlaceColor,
        // valueSelector: function(d) {
        //     return artworkPlaceColor(artwork_place_count[d.properties.CNTR_ID] || 0); // se indefinito assegna ZERO
        // },
        .attr('opacity', 0.7)
        .attr('stroke', "black")
        .attr('stroke-width', 0.2)
        // .attr('stroke-dasharray',(3,3) )
    ;
    
}

// ADD BUTTONS
// http://getbootstrap.com/components/#btn-groups-single
// <div class="btn-group" role="group" aria-label="...">
//   <button type="button" class="btn btn-default">First</button>
//   <button type="button" class="btn btn-default">Second</button>
// </div>

var buttonGroup = d3.select("#instructions")
    .append("div")
    .attr("id", "buttonGroup")
    .classed("btn-group", true)
    .classed("btn-group-xs", true)
    .attr("role", "group");
    
console.log("handler", d3.values(attributesHandler));

buttonGroup.selectAll("button")
    .data(d3.values(attributesHandler))
    .enter()
    .append("button")
    .attr("type", "button")
    .classed("btn", true)
    .classed("btn-default", true)
    .attr("value", function(d) {
        return d.value
    })
    .text(function(d) {
        return d.label
    })
    .on("click", function() {
        var val = this.value;
        console.log("button_val", val);
        // call functions on click
        changeMapColor(val);
    });
