function SvgToPdf(svg){
	var self = this;
	var margin = 50;
	this.doc = new PDFDocument({size: [svg.width()+margin,svg.height()+margin]});
	this.stream = this.doc.pipe(blobStream());
	this.svg = svg;
	
	this.button = $('<button>Convert to PDF</button>').click(function(){
		self.convert();
	});
	$(svg).before(this.button);
	
	this.stream.on('finish', function() {
		var link = $(document.createElement('a')).attr("href", self.stream.toBlobURL('application/pdf'))
		.attr("download", 'graph.pdf')
		.text('PDF ready to download');
		$(self.button).after(link);
	});
}

SvgToPdf.prototype.convert = function(){
	var self = this;
	this.traverse(this.svg);
	this.doc.end();
}

SvgToPdf.prototype.parseColor = function(color){
	m = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if(m) {
        return [m[1],m[2],m[3]];
    }
}

SvgToPdf.prototype.parseSize = function(color){
	m = color.match(/^\s*(\d+)\s*px$/i);
    if(m) {
        return m[1]
    }
}

SvgToPdf.prototype.parseEm = function(attr){
	if(typeof attr != 'undefined'){
		var m = attr.match(/^\s*(\d*\.?\d*)\s*em$/i);
		if(m) {
			return m[1];
		}
	}
	return 0;
}

SvgToPdf.prototype.traverse = function(parent){
	var self = this;
	if (parent.is("text")){
		var style = parent.css(['fill','stroke','opacity','font-size','font-weight','text-anchor']);
		var box = parent[0].getBBox();
		//FIXME: use more accurate positioning!!
		var x, y, xOffset = 0;
		switch(style['text-anchor']) {
			case 'end': xOffset = box.width; break;
			case 'middle': xOffset = box.width / 2; break;
			case 'start': break;
		}
		
		var dy = this.parseEm(parent.attr('dy')) * box.height * 2.0;
		x = Number(parent.attr('x')) - xOffset;
		y = Number(parent.attr('y')) - box.height + dy; // I think SVG adresses the lower left and pdf the upper left point of the text box
		
		
		var fontName = "Helvetica";
		if(style['font-weight']  == 'bold' || style['font-weight']  == '700'){
			fontName = "Helvetica-Bold";
		}
		var fSize = this.parseSize(style['font-size']);
		this.doc.font(fontName).fontSize(fSize).fillColor(this.parseColor(style['fill']))
		.text(parent.text(),x, y);
	}
	else if(parent.is("circle")){
		var style = parent.css(['fill','stroke','opacity','stroke-width']);
		var cx = Number(parent.attr('cx'));
		var cy = Number(parent.attr('cy'));
		var rr = Number(parent.attr('r'));
		
		this.doc.circle(cx, cy, rr)
	   .lineWidth(style['stroke-width'])
	   .opacity(style['opacity'])
	   .fillAndStroke(this.parseColor(style['fill']), this.parseColor(style['stroke']));
	}
	else if(parent.is("rect")){
		var style = parent.css(['fill','stroke','opacity','stroke-width']);
		var cleanup = function(x){if(isNaN(x)) return 0; else return x;}
		var x = cleanup(Math.round(Number(parent.attr('x'))));
		var y = cleanup(Math.round(Number(parent.attr('y'))));
		var h = cleanup(Math.round(Number(parent.attr('height'))));
		var w = cleanup(Math.round(Number(parent.attr('width'))));
		
		this.doc.rect(x,y,w,h)
	   .opacity(style['opacity'])
	   .fillAndStroke(this.parseColor(style['fill']), this.parseColor(style['stroke']));
	}
	else if(parent.is("line")){
		var style = parent.css(['stroke','opacity','stroke-width']);
		var x2 = Number(parent.attr('x2'));
		var y2 = Number(parent.attr('y2'));
		this.doc.moveTo(0,0).lineTo(x2,y2)
		.lineWidth(style['stroke-width'])
		.strokeOpacity(style['opacity'])
		.stroke(this.parseColor(style['stroke']));
	}
	else if(parent.is("path")){
		var style = parent.css(['fill','stroke','opacity','stroke-width']);
		if(style['stroke'] == 'none'){
			this.doc.path(parent.attr("d"))
			.fillColor(this.parseColor(style['fill']))
			.fillOpacity(style['opacity'])
			.fill();
		}
		else if(style['fill'] == 'none'){
			this.doc.path(parent.attr("d"))
			.lineWidth(style['stroke-width'])
			.strokeColor(this.parseColor(style['stroke']))
			.strokeOpacity(style['opacity'])
			.stroke();
		}
		else{
		this.doc.path(parent.attr("d"))
			.lineWidth(style['stroke-width'])
			.fillColor(this.parseColor(style['fill']))
			.strokeColor(this.parseColor(style['stroke']))
			.strokeOpacity(style['opacity'])
			.fillOpacity(style['opacity'])
			.fillAndStroke();
		}
		
	}
	else{
		this.doc.save();
		
		if (parent.is("g[transform]")) {
			console.log("g");
			var a = parent.attr("transform");
			var parts  = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/.exec(a);
			nx = Number(parts[1]);
			ny = Number(parts[2]);
			this.doc.translate(nx,ny);
		}
		
		parent.children().each(function(){
				self.traverse($(this));
		});
		
		this.doc.restore();
	}
};

jQuery(document).ready(function ($) {
	$("svg").each(function(){
		new SvgToPdf($(this));
	});
});



   



   
