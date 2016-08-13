(function() {

  var props = function(sel, fn) {
    var targetWidth = document.getElementById(sel.slice(1)).offsetWidth
        , targetHeight = targetWidth
        , s = targetWidth > 800 ? 800: targetWidth
        , t = s * 0.05
        , m = {top: 0, right: 0, bottom: t*3, left: 0}
        , w = s - m.left - m.right
        , h = s - m.top - m.bottom
        , fs = {md: t/2.6 + 'pt', sm: t/3 + 'pt'}
        , r = t * 0.25
        , params = {s:s, t:t, m:m, w:w, h:h, fs: fs, r: r}
 
      fn(params)
    };

  var zip = function zip(arrays) {
    return arrays[0].map(function(_, i) {
      return arrays.map(function(array) {
        return array[i]
      })
    });
  }
  
  var colors = {'gray': '#96A6A6',
                'blue': '#3498DB',
                'green': '#2ECC71',
                'red': '#E74C3C',
                'orange': '#E67E22',
                'purple': '#8E44AD',
                'yellow': '#F1C40F'};
  
  var c = {'t': {'name': 'Tools', 'color': colors.gray},
           's': {'name': 'Statistics', 'color': colors.orange},
           'g': {'name': 'General purpose', 'color': colors.blue},
           'r': {'name': 'Real-time', 'color': colors.red},
           'v': {'name': 'Visualization', 'color': colors.green},
           'p': {'name': 'Reproducibility', 'color': colors.purple},
           'e': {'name': 'Environment', 'color': colors.yellow}};
  
  var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.x, d.y]; });

  var render = function(p, sel) {

    d3.json('./tools.json', function(data) {
 
    var psel = d3.select(sel)

    var svg = psel.selectAll('svg').data([undefined])

    svg
      .attr("width", p.w)
      .attr("height", p.h+p.m.bottom)

    svg.enter()
      .append("svg")
      .attr("width", p.w)
      .attr("height", p.h+p.m.bottom)

    var g = svg.selectAll('.g').data([undefined]) 
      g
        .attr("transform", "translate(" + p.t + ", 0)");
      g.enter()
        .append("g")
        .attr('class', 'g')
        .attr("transform", "translate(" + p.t + ", 0)");

     var cluster = d3.layout.cluster()
        .size([p.w-p.m.top-p.m.bottom, p.h-p.m.left-p.m.right])

     var nodes = cluster.nodes(data);
  
     var link = g.selectAll('.link').data(cluster.links(nodes))

     link
       .attr("d", diagonal)

     link.enter()
       .append("path")
       .attr("class", "link")
       .attr("d", diagonal)
       .style("fill", "none")
       .style("stroke", "#7F8C8D")
       .style("stroke-width", "1.5px");
 
     var selFunc = function(d) { return d.name }
     var nodeG = g.selectAll('.node').data(nodes, selFunc)
     nodeG.each(function(datum, idx) {
       var thisNode = d3.select(this)
         , thisNodeCircle = thisNode.select('circle')
         , thisLeafA = thisNode.select('.leaf')
         , thisLeafATxt = thisLeafA.select('text')
         , thisInnerTxt = thisNode.select('.inner-txt')

       thisNode
          .attr("display", datum.depth ? null : "none")
          .attr("transform", "translate(" + datum.x + "," + (datum.y) + ")")

       thisNodeCircle 
          .attr("r", p.r)
          .attr("fill", function() {
              var key = c[datum.type];
              if (key !== undefined) {
                return c[datum.type].color 
                } 
              else {return "black"}
          });

       thisLeafA.attr("xlink:href", datum.url)
       thisLeafATxt
         .attr("transform", 'translate(' + (p.r/2) + ',' + (p.r*2) + ')' + 'rotate(-40)')
         .text(datum.name)
         .style('font-size', p.fs.sm)

       thisInnerTxt
        .attr("transform", 'translate(' + (-(p.r*1.5)) + ',' + (p.r/2) + ')')
        .text(datum.name)
        .style('font-size', p.fs.sm)
     })

     var enNodeG = nodeG.enter()
       .append("g")
       .attr("display", function(d) { return d.depth ? null : "none"; })
       .attr("class", "node")
       .attr("transform", function(d) { return "translate(" + d.x + "," + (d.y) + ")"; })

     enNodeG.append("circle")
       .attr("r", p.r)
       .attr("fill", function(d) {
           var key = c[d.type];
           if (key !== undefined) {
             return c[d.type].color 
             } 
           else {return "black"}
       });

     var leaves = enNodeG.filter(function(d) {return d.children === undefined}),
         inside = enNodeG.filter(function(d) {return d.children !== undefined});
  
    leaves.append("a")
      .attr('class', 'leaf')
      .attr("xlink:href", function(d) {return d.url})
      .append("text")
      .attr("text-anchor", "end")
      .attr("fill", "#137EC2")
      .attr("transform", function(d) { return 'translate(' + (p.r/2) + ',' + (p.r*2) + ')' + 'rotate(-40)'})
      .text(function(d) { return d.name; })
      .style('font-size', p.fs.sm)
 
    inside.append("text")
      .attr('class', 'inner-txt')
      .attr("text-anchor", "end")
      // .attr("dy", 4)
      // .attr("dx", -p.t/3)
      .attr("transform", 'translate(' + (-(p.r*1.5)) + ',' + (p.r/2) + ')')
      .text(function(d) { return d.name; })
      .style('font-size', p.fs.sm)
  
    var ckeys = Object.keys(c)
      , cvals = ckeys.map(function(d) {return c[d].color})
      , cnames = ckeys.map(function(d) {return c[d].name})
      , legendData = zip([cnames, cvals])
          .filter(function(d) {return d[0] !== "Tools"})
   
    var lselFunc = function(d) { return d[0] }
    var legendG = g.selectAll('.legend').data([undefined])
    legendG.enter()
      .append("g")
      .attr('class', 'legend')

    var lNodes = legendG.selectAll('circle').data(legendData, lselFunc)
    lNodes
      .attr("cy", function(d, i) {return (i+1)*p.t})
      .attr("r", p.t/3)
      .attr("fill", function(d) {return d[1]})
    lNodes.enter()
      .append("circle")
      .attr("cx", 0)
      .attr("cy", function(d, i) {return (i+1)*p.t})
      .attr("r", p.t/3)
      .attr("fill", function(d) {return d[1]})
    
    var lText = legendG.selectAll('.ltext').data(legendData, lselFunc)
    lText
      .attr("dx", p.t/2)
      .attr("dy", p.t/5)
      .attr("y", function(d, i) {return (i+1)*p.t})
      .text(function(d) {return d[0]})
      .style('font-size', p.fs.md)
    lText.enter()
      .append("text")
      .attr('class', 'ltext')
      .attr("dx", p.t/2)
      .attr("dy", p.t/5)
      .attr("y", function(d, i) {return (i+1)*p.t})
      .text(function(d) {return d[0]})
      .style('font-size', p.fs.md)
    });
  };

  var assemble = function() {
    var sel = '#tools'
    props(sel, function(p) {
      render(p, sel);
    })
  }
  assemble()
  window.addEventListener('resize', assemble)
})();
