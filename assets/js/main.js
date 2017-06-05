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

// LEGEND Preparation
var legendRectSize = 18;
var legendSpacing = 4;


// COLOR SCALE
// color scale Birth Place gray
var birthPlaceColor = d3.scale.quantile()
    .range(colorbrewer.Oranges[9]);
// color scale Artwork Place orange
var artworkPlaceColor = d3.scale.quantile()
    .range(colorbrewer.Greys[9]);

birth_place_count = {}
artwork_place_count = {}

// HANDLER
var attributesHandler = {
    "birthPlace": {
        value: "birthPlace",
        label: "birth place",
        count: birth_place_count,
        colorScale: birthPlaceColor,
        valueSelector: function(d) {
            return birthPlaceColor(birth_place_count[d.properties.CNTR_ID] || 0); // se indefinito assegna ZERO
        },
        title: "Artist by country",
        description: "Number of artists born in each country"
    },
    "artworkPlace": {
        value: "artworkPlace",
        label: "artwork place",
        count: artwork_place_count,
        colorScale: artworkPlaceColor,
        valueSelector: function(d) {
            return artworkPlaceColor(artwork_place_count[d.properties.CNTR_ID] || 0); // se indefinito assegna ZERO
        },
        title: "Artwork by country",
        description: "Number of artwork in each country"
    }
};

// Define the div for the tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


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
    attributesHandler["birthPlace"].count = birth_place_count;

    // GROUP artwork by ARTWORK MUSEUM PLACE
    artwork_place_count = d3.nest()
        .key(function(d) {
            return d.ARTWORK_PLACE_ISO2
        })
        .rollup(function(leaves) {
            return leaves.length
        })
        .map(opere);
    attributesHandler["artworkPlace"].count = artwork_place_count;





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
    changeMap('birthPlace');
    setTooltip(birth_place_count);


}



function setTooltip(selection) {

    // TOOLTIP on countries mouseover 
    path.on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .8);
            tooltip.html("<strong>" + d.properties.CNTR_ID + "</strong><br/>" + (selection[d.properties.CNTR_ID] || 0)) //ripartire dal fatto che non prende selection (bischerata)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function(d) {
            console.log("stato cliccato", d.properties.CNTR_ID)
            //aggiungo il nome stato 
            country = d.properties.CNTR_ID
            d3.select("#colonna1 h4").text("Hai selezionato lo stato: "+ country);

            



        });

}


//// MAIN FUNCTION TO CONTROL MAP
function changeMap(selection) {
    var handler = attributesHandler[selection];
    updateMapColors(handler.colorScale, handler.valueSelector);

    //Change Title Map
    d3.select("#titleMap")
        .text(handler.title)
        //Change Map Legend
    d3.select("#mapDescription")
        .text(handler.description)
        //Change Legend
    updateLegend(handler.colorScale);
    setTooltip(handler.count);
}


function updateMapColors(colorScale, valSel) {
    svg.selectAll("path.stato")
        .transition()
        .duration(1500)
        .attr("fill", valSel)
        //added function to handler!!!

    .attr('opacity', 0.7)
        .attr('stroke', "black")
        .attr('stroke-width', 0.2)
        //.attr('stroke-dasharray',(3,3) )
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
        changeMap(val);
        // setTooltip(attributesHandler[val].count); //CORREGGERE QUI
    });


// ADD LEGEND SECTION
function updateLegend(colorScale) {

    d3.select("#legend svg").remove();

    var legend = d3.select("#legend")
        .append("svg")
        .attr('height', 180)
        .selectAll('g')
        .data(colorScale.range())
        .enter()
        .append('g')
        .attr('class', 'legendEntry');


    legend.append('rect')
        .attr("x", 20) //leave 5 pixel space after the <rect>
        .attr("y", function(d, i) {
            return i * 20;
        })
        .attr("width", legendRectSize)
        .attr("height", legendRectSize)
        .style("stroke", "black")
        .style("stroke-width", 0.2)
        .style("fill", function(d) {
            return d;
        })
        .attr("opacity", 0.7);

    legend.append('text')
        .text(function(d, i) {
            var extent = colorScale.invertExtent(d);
            //extent will be a two-element array, format it however you want:
            var format = d3.format("0f");
            return format(+extent[0]) + " - " + format(+extent[1]);
        })
        .attr("x", 50) //leave 5 pixel space after the <rect>
        .attr("y", function(d, i) {
            return i * 20;
        })
        .attr("dy", "1.2em") //place text one line *below* the x,y point
        .attr('fill', "black")
        // .attr("dy", "0.8em") //place text one line *below* the x,y point

    /// END LEGEND SECTION ///

}
