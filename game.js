function toDataURL(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.onload = function() {
	  var reader = new FileReader();
	  reader.onloadend = function() {
		callback(url,reader.result);
	  }
	  reader.readAsDataURL(xhr.response);
	};
	xhr.open('GET', 'img/' + url);
	xhr.responseType = 'blob';
	xhr.send();
}

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
	}
	return array;
}

function copyDict(dict){
	return JSON.parse(JSON.stringify(dict));
}

function PaperTown(){
    var self = this;
	var margin = 50;
	this.doc = new PDFDocument({size: "A4", layout : 'landscape', margin : 0});
	this.stream = this.doc.pipe(blobStream());
	this.fontName = "Helvetica";
	this.fontSize = 25;

    this.stream.on('finish', function() {
		var link = $(document.createElement('a')).attr("href", self.stream.toBlobURL('application/pdf'))
		.attr("download", 'PaperTown_Level.pdf')
		.text('PDF ready to download');
		document.body.appendChild(link[0]);
		link[0].click();
		document.body.removeChild(link[0]);
		//window.URL.revokeObjectURL(url);
	});
};

PaperTown.prototype._drawHexagon = function(x,y,r){
	var points = [];
	for (let i=0; i < 7; i++) {
		let cx = x + r * Math.cos(i * 2 * Math.PI / 6 +  Math.PI / 6);
		let cy = y + r * Math.sin(i * 2 * Math.PI / 6 +  Math.PI / 6);
		points.push([cx,cy]);
	}
	return this.doc.polygon(... points);
};

PaperTown.prototype._drawHexagonRow = function(x,y,radius,n, border, types){
	let step = Math.sqrt(3) * radius;
	for (let i=0; i < n; i++) {
		this._drawHexagon(x + i*step,y,radius).lineWidth(2).fillOpacity(0.2).fillAndStroke(this.typeToColor[types[i]],'white');
	}
};

PaperTown.prototype._drawHexagonArray = function(x,y,radius,nx,ny, border, types){
	for(let i=0; i<this.rowCount; i++){
		for(let j=0; j<this.columnCount; j++){
			let pos = this._getPosition(j,i);
			let borderColor = '#fff';
			if(types[i][j] == 7){
				continue;
			}
			this._drawHexagon(pos.x,pos.y,this.radius).lineWidth(2).fillOpacity(0.2).fillAndStroke(this.typeToColor[types[i][j]], borderColor);
		}
	}
	for(let i=0; i<this.rowCount; i++){
		for(let j=0; j<this.columnCount; j++){
			let pos = this._getPosition(j,i);
			let borderColor = '#000';
			if(types[i][j] != 7){
				continue;
			}
			this._drawHexagon(pos.x,pos.y,this.radius).lineWidth(2).fillOpacity(0.2).fillAndStroke(this.typeToColor[types[i][j]], borderColor);
		}
	}
};

PaperTown.prototype._getPosition = function(column, row){
	let columnStep = Math.sqrt(3) * this.radius + this.tileBorder;
	let rowStep = (Math.sqrt(3)/2 + 1/2) * this.radius + this.tileBorder + Math.sqrt(3);
	let offset = 0;
	if(row % 2 == 1){
		offset = Math.sqrt(3)/2 * this.radius + 2;
	}
	x = this.startX + column * columnStep + offset;
	y = this.startY + row * rowStep;
	return {
		'x' : x,
		'y' : y
	}
}

PaperTown.prototype._goalTypes = [
	{
		'id' : 'harbor',
		'title' : 'Shining new harbor',
		'description' : 'Gain 1 Million for every renovated block touching a water (blue) block.'
	},
	{
		'id' : 'horizontal',
		'title' : 'East to West',
		'description' : 'Gain 1 Million for each horizontal line in the city in which you have renovated at least one block.'
	},
	{
		'id' : 'vertical',
		'title' : 'North to South',
		'description' : 'Gain 1 Million for each vertical line in the city in which you have renovated at least one block.'
	},
	{
		'id' : 'bigger',
		'title' : 'Shining new harbor',
		'description' : 'Gain 1 Million for every 2 of your renovated blocks in your largest (connected) renovation area.'
	},
	{
		'id' : 'arround-old-town',
		'title' : 'Renovate arround old town',
		'description' : 'Gain 1 Million for every renovated block touching an old town (black) block.'
	},
	{
		'id' : 'broadway',
		'title' : 'A broadway',
		'description' : 'Gain 2 Million for every renovated block on the horizontal line with the most of your renovated blocks.'
	}
];

PaperTown.prototype._hotspotTypes = [
	{
		'id' : 'bank',
		'image' : 'bank.png',
		'title' : 'Bank',
		'description' : 'You gain 3 Million at the end of the game for every Bank touching at least one of your renovated blocks.'
	},
	{
		'id' : 'tool',
		'image' : 'tool.png',
		'title' : 'Local branch',
		'description' : 'For every local branch you may renovate one additional block at the border of the map.'
	},
	{
		'id' : 'Bakery',
		'image' : 'cupcake.png',
		'title' : 'Bakery',
		'description' : 'For every bakery you may renovate one addtional block in the gray zone.'
	},
	{
		'id' : 'building',
		'image' : 'building.png',
		'title' : 'Building Material',
		'description' : 'Renovate one addtional block in the color that you are allowed to renovate this turn.'
	},
	{
		'id' : 'bribery',
		'image' : 'bribery.png',
		'title' : 'Bribery',
		'description' : 'Instead of your normal turn you may renovate a single block of any color(except black). Normal renovation rules apply.'
	}
];

PaperTown.prototype._randomIndexSet = function(n, length){
	let indexSet = new Set();
	while(indexSet.size < n){
		let r = Math.random();
		indexSet.add(Math.floor(r * length));
	}
	return indexSet;
}

PaperTown.prototype._addHotspots = function(){
	var self = this;
	let singles = this.map._findSingles();
	let hotspots = this._randomIndexSet(6, singles.length);

	this.setOfHotspotTypes = this._randomIndexSet(3, this._hotspotTypes.length);
	let list = Array.from(this.setOfHotspotTypes);
	var hotspotOrder = shuffleArray(list.concat(list));
	console.log(hotspotOrder);
	
	var typeIndex = 0;
	this.hotspots = [];
	hotspots.forEach(function(i){
		self.map.map[singles[i].row][singles[i].column] = 7;
		self.hotspots.push(copyDict(self._hotspotTypes[hotspotOrder[typeIndex]]));
		self.hotspots[typeIndex].row = singles[i].row;
		self.hotspots[typeIndex].column = singles[i].column;
		typeIndex++;
	});
};

PaperTown.prototype.typeToColor = {
	0 : [0, 0, 0],
	1 : [137, 150, 165],
	2 : [0, 243, 158],
	3 : [0, 203, 243],
	4 : [175, 243, 0],
	5 : [255, 198, 26],
	6 : [226, 1, 103],
	7 : [255, 255, 255]
};

PaperTown.prototype.images = {
	'bank.png' : '',
	'tool.png' : '',
	'cupcake.png' : '',
	'mayor.png' : '',
	'building.png' : '',
	'bribery.png' : '',
	'qrcode.png' : ''
}

PaperTown.prototype._loadImages = function(afterLoad){
	var numberOfImages = Object.keys(this.images).length;
	var loadingCount = 0;
	var self = this;

	for(let imageUrl in this.images){
		toDataURL(imageUrl, function(url,dataUrl) {
			self.images[url] = dataUrl;
			loadingCount++;
			if(loadingCount == numberOfImages){
				afterLoad();
			}
		});
	}
};

PaperTown.prototype._createHeader = function(){
	let headerY = 20;
	this.doc.rect(this.startX- this.radius * Math.sqrt(3)/2, headerY, 735, 130).lineWidth(1).fillAndStroke('white', 'black');
	this.doc.rect(this.startX- this.radius * Math.sqrt(3)/2, headerY, 735, 20).fill('black');
	this._drawHexagon(this.startX, headerY + 10,24).lineWidth(2).fillOpacity(0.2).fillAndStroke('black', 'white');
	this.doc.image(this.images['mayor.png'], this.startX -12, headerY -2 , {'width': 24, 'height':24});
	this.doc.fillColor('white').font('Helvetica-Bold').text('The mayor is paying for the following (at the end of the game):', this.startX+ 35, headerY + 5);

	let goalIndices = this._randomIndexSet(3, this._goalTypes.length);
	let goals = Array.from(goalIndices).map(i => this._goalTypes[i])
	let textWidth = 200;
	for(let i=0; i<goals.length; i++){
		let g = goals[i];
		this.doc.fillColor('black').font('Helvetica-Bold').text(g.title,this.startX + 35 + i * (textWidth+15), headerY + 30, {'width' : textWidth, 'align' : 'left'});
		this.doc.fillColor('black').font('Helvetica').text(g.description,this.startX + 35 + i * (textWidth+15), headerY + 50, {'width' : textWidth, 'align' : 'left'});
	}

	let timeX = headerY + 110;
	this.doc.fillColor('black').font('Helvetica-Bold').text('Time left:', this.startX + 35, timeX, {'width' : textWidth, 'align' : 'left'});
	for(let i=0; i<16; i++){
		this.doc.rect(this.startX + 100 + i* 30, timeX-5,20,20).lineWidth(2).fillAndStroke('white', 'black');
	}

	this.doc.fillColor('white').font('Helvetica').text('Dice: visit bit.ly/2N6haIG or scan:', this.startX+ 490, headerY + 5);
	this.doc.image(this.images['qrcode.png'], this.startX + 670, headerY -10 , {'width': 80, 'height':80});
}

PaperTown.prototype._createFooter = function(){
	let footerY = 490;
	let boxWidth = 231;
	let boxHeight = 90;
	let footerX = this.startX- this.radius * Math.sqrt(3)/2;

	let differentHotspots = [];
	let hsTypes = Array.from(this.setOfHotspotTypes);
	for(let i=0; i<hsTypes.length; i++){
		let type = hsTypes[i];
		differentHotspots.push(copyDict(this._hotspotTypes[type]));
	}

	for(let i=0; i<differentHotspots.length; i++){
		let step = i * (boxWidth + 20);
		this.doc.rect(footerX + step, footerY, boxWidth, boxHeight).lineWidth(1).fillAndStroke('white', 'black');
		this.doc.rect(footerX + step, footerY, boxWidth, 20).fill('black');
		this._drawHexagon(footerX + step + 10,footerY + 10,20).lineWidth(2).fillOpacity(0.2).fillAndStroke('white', 'black');
		this.doc.image(this.images[differentHotspots[i].image], footerX + step,footerY, {'width': 20, 'height':20});
		this.doc.fillColor('white').font('Helvetica-Bold').text(differentHotspots[i].title, footerX + step + 35, footerY + 5);
		this.doc.fillColor('black').font('Helvetica').text(differentHotspots[i].description,footerX + step + 20, footerY + 30, {'width' : boxWidth-30, 'align' : 'left'});

		for(let i=0; i<2; i++){
			this.doc.rect(footerX + step + boxWidth - 60 + i * 30, footerY+ boxHeight - 10 ,20,20).lineWidth(2).fillAndStroke('white', 'black');
		}
	}
};

PaperTown.prototype.createNew = function(){
	var self = this;
	this.map = new TownMap(20,10);
	this.startX = 40*1.8;
	this.startY = 180;
	this.radius = 18;
	this.columnCount = 20;
	this.rowCount = 10;
	this.tileBorder = 5;


	this._loadImages(function(){
		self._addHotspots();
		self._drawHexagonArray(self.startX, self.startY, self.radius, self.columnCount, self.rowCount, self.tileBorder, self.map.map);
		
		for(let hotspot of self.hotspots){
			let pos = self._getPosition(hotspot.column, hotspot.row);
			self.doc.image(self.images[hotspot.image], pos.x-9, pos.y-9, {'width': 18, 'height':18});
		} 
		self._createHeader();
		self._createFooter();
		self.doc.end();
	});
};


function TownMap(width, height){
	this.width = width;
	this.height = height;
	this._createMap();
};

TownMap.prototype._create2DArray = function(w,h){
	var arr = new Array(w);
	for(let i=0; i<h; i++){
		arr[i] = new Array(w);
	}
	return arr;
};

TownMap.prototype._predecessors = function(x,y){
	let result = [];
	if(y>0 && x >= 0){
		//result.push(this.map[y-1][x]);
	}
	if(y>0 && x < this.width-1){
		result.push(this.map[y-1][x+1]);
	}
	if(y>=0 && x>0){
		result.push(this.map[y][x-1]); 
	}
	return result;
};

TownMap.prototype._majorityType = function(x,y){
	let counts = [];
	let max = 0;
	let maxType = -1;
	let types = this._predecessors(x,y);
	for (var i = 0; i < types.length; i++) {
		counts[types[i]] = 1 + (counts[types[i]] || 0);
		if(counts[types[i]] > max){
			max = counts[types[i]];
			maxType = types[i];
		}
	}
	return maxType;
};
const lowProb = 0.05;
const highProb = 0.7;
TownMap.prototype._rules = [
	[highProb, lowProb, lowProb, lowProb, lowProb, lowProb, lowProb], // 0 ->
	[lowProb, highProb, lowProb, lowProb, lowProb, lowProb, lowProb], // 1 ->
	[lowProb, lowProb, highProb, lowProb, lowProb, lowProb, lowProb], // 2 ->
	[lowProb, lowProb, lowProb, highProb, lowProb, lowProb, lowProb], // 3 ->
	[lowProb, lowProb, lowProb, lowProb, highProb, lowProb, lowProb], // 4 ->
	[lowProb, lowProb, lowProb, lowProb, lowProb, highProb, lowProb], // 5 ->
	[lowProb, lowProb, lowProb, lowProb, lowProb, lowProb, highProb], // 6 ->
];

TownMap.prototype._tile = function(row, column){
	if(row >= 0 && column >= 0 && row < this.height && column < this.width){
		return this.map[row][column];
	}
	else{
		return -1;
	}
}

TownMap.prototype._findSingles = function(){
	let singles = [];
	for(let i=0; i<this.height; i++){
		for(let j=0; j<this.width; j++){
			let tileType = this._tile(i,j);
			if(this._tile(i,j-1) != tileType && this._tile(i,j+1) != tileType && 
				this._tile(i-1,j) != tileType && this._tile(i+1,j) != tileType &&
				this._tile(i-1,j-1) != tileType && this._tile(i+1,j-1) != tileType){
				
				singles.push({
					'row' : i,
					'column' : j
				});
			}
		}
	}
	return singles;
};

TownMap.prototype._createMap = function(){
	this.map = this._create2DArray(this.width,this.height);
	for(let i=0; i<this.height; i++){
		for(let j=0; j<this.width; j++){
			let majority = this._majorityType(j,i);
			let r = Math.random();
			let cumsum  = 0;
			if(majority == -1){
				this.map[i][j] = Math.floor(r * 7);
			}
			else{
				for(let k=0; k<7; k++){
					cumsum = cumsum + this._rules[majority][k];
					if(r < cumsum){
						this.map[i][j] = k;
						break;
					}
				}
			}
		}
	}
}

$(document).ready(function(){
    $('.download-new-sheet').click(function(event){
		event.preventDefault();
		var town = new PaperTown();
		town.createNew();
    });
});
