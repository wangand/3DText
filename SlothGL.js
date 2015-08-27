SlothGL = function(){
	// Shaders
	this.vshader = 
		'attribute vec4 a_Position;\n' +
		'attribute vec2 a_TexCoord;\n' +
		'varying vec2 v_TexCoord;\n' +
		'uniform vec4 u_Translation;\n' +
		'uniform mat4 u_xformMatrix;\n' +
		'void main() {\n' +
		'  gl_Position = u_xformMatrix * a_Position;\n' +
		'  gl_Position +=u_Translation;\n' +
		'  v_TexCoord = a_TexCoord;\n' +
		'}\n';
		
	this.fshader = 
		'#ifdef GL_ES\n' +
		'precision mediump float;\n' +
		'#endif\n' +
		'uniform sampler2D u_Sampler;\n' +
		'varying vec2 v_TexCoord;\n' +
		'void main() {\n' +
		'  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
		'}\n';
	
	// WebGL program
	this.gl;
	
	// Text and Images stored here
	this.textures = new TextureHolder();
	
	// Projection matrix to give 2D-canvas-like coordinates
	// Default as identity matrix
	this.projectionMatrix = new Float32Array([
		1.0,  0.0, 0.0, 0.0,
		0.0,  1.0, 0.0, 0.0,
		0.0,  0.0, 1.0, 0.0,
		0.0,  0.0, 0.0, 1.0
	]);
	
	// Color, font
	this.color = "red";
	this.font = "20px Times New Roman";
	
	// Canvas
	this.canvas;
}

SlothGL.prototype.hello = function(){
	console.log("SlothGL: WebGL for the lazy");
}

SlothGL.prototype.setup = function(canvas){
	this.canvas = canvas;
	
	// Get a WebGL context inspired from example on MDN:
	// https://developer.mozilla.org/en-US/docs/Web/WebGL/Getting_started_with_WebGL
	this.gl = null;
	this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	// Make sure we got a context
	if (!this.gl) {
		alert("Failed to initialize WebGL. Please use a WebGL compatible browser.");
		this.gl = null;
		return;
	}

	// This code allows WebGL to blend alpha values
	// from: http://webglfundamentals.org/webgl/lessons/webgl-text-texture.html
	this.gl.enable(this.gl.BLEND);
	this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

	// Initialize shaders
	// this.gl is now defined
	if (!this.initializeShaders(this.gl, this.vshader, this.fshader)) {
		console.log('Failed to intialize shaders.');
		return;
	}
	
		// Ready vertex buffer
		var vertexTexCoordBuffer = this.gl.createBuffer();
		if (!vertexTexCoordBuffer) {
			console.log('Failed to create the buffer object');
			return -1;
		}
		// Bind the buffer object to target
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexTexCoordBuffer);
	
	// Set up the projection matrix for 2D canvas-like coordinates
	this.reproject(canvas);
	// Pass the transformation matrix to the vertex shader via Uniform Variable
	var u_xformMatrix = this.gl.getUniformLocation(this.gl.program, 'u_xformMatrix');
	if (!u_xformMatrix) {
		console.log('Failed to get the storage location of u_xformMatrix');
		return;
	}
	this.gl.uniformMatrix4fv(u_xformMatrix, false, this.projectionMatrix);
}

SlothGL.prototype.initializeShaders = function(gl, vshader, fshader){
	// make and verify vertex shader object
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	if(vertexShader == null){
		console.log("Unable to create vertex shader");
		return false;
	}
	
	// set vertex shader program source and compile
	gl.shaderSource(vertexShader, vshader);
	gl.compileShader(vertexShader);
	
	// Check result of vertexShader compilation
	if(!(gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))){
		var errorMsg = gl.getShaderInfoLog(vertexShader);
		console.log('Failed to compile vertex shader: ' + errorMsg);
		gl.deleteShader(vertexShader);
		return false;
	}
	
	
	// make and verify fragment shader object
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	if(fragmentShader == null){
		console.log("Unable to create fragment shader");
		return false;
	}
	
	// set fragment shader program source and compile
	gl.shaderSource(fragmentShader, fshader);
	gl.compileShader(fragmentShader);
	
	// Check result of fragmentShader compilation
	if(!(gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))){
		var errorMsg = gl.getShaderInfoLog(fragmentShader);
		console.log('Failed to compile fragment shader: ' + errorMsg);
		gl.deleteShader(fragmentShader);
		return false;
	}

	// Verify both shaders created
	if(!vertexShader || !fragmentShader){
		console.log("shaders no load");
		return false;
	}

	// make and verify program object
	var program = gl.createProgram();
	if(!program){
		console.log("program no create");
		return false;
	}

	// Attach vertex and fragment shader to program object
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	// Link program and verify linkng
	gl.linkProgram(program);
	if(!(gl.getProgramParameter(program, gl.LINK_STATUS))){
		var errorMsg = gl.getProgramInfoLog(program);
		console.log('Program filed to link: ' + errorMsg);
		gl.deleteProgram(program);
		gl.deleteShader(fragmentShader);
		gl.deleteShader(vertexShader);
		console.log("no program got");
		return false;
	}

	// Use and set the program
	gl.useProgram(program);
	gl.program = program;
	return true;
}

SlothGL.prototype.clear = function(){
	// Specify the color for clearing <canvas>
	this.gl.clearColor(0, 0, 0, 1);

	// Clear renderer
	this.gl.clear(this.gl.COLOR_BUFFER_BIT);
}

SlothGL.prototype.reproject = function(webglcanvas){
	// Formula
	// newX = (x-width/2)/(width/2);
	// newY = ((height-y)-(height/2)) / (height/2)
	
	// For matrix use
	// newX = x/(width/2) - 1
	// newY =  - 1
	
	width = webglcanvas.width;
	height = webglcanvas.height;

	tempArray = [
		1/(width/2),  0.0, 0.0, 0.0, 
		0.0,  -2/height,  0.0, 0.0,
		0.0,  0.0, 1.0,  0.0,
		-1.0,  1.0, 0.0, 1.0
	];
	this.projectionMatrix = new Float32Array(tempArray);
}

SlothGL.prototype.render = function(){
	this.textures.render(this.canvas, this.gl);
}

SlothGL.prototype.setColor = function(color){
	this.color = color;
	this.textures.setColor(color);
}

SlothGL.prototype.getColor = function(){
	return(this.textures.getColor());
}

SlothGL.prototype.setFont = function(font){
	this.font = font;
	this.textures.setFont(font);
}

SlothGL.prototype.fillText = function(text, x, y){
	this.textures.addWord(text, x, y, this.gl);
}

SlothGL.prototype.drawImage = function(img, x, y, width, height){
	this.textures.addImage(img, x, y, width, height);
	console.log("drawImage slothgl");
}

function TextureHolder(){
	// Default size of canvas
	this.defaultSize = 1024; // here for easy access

	// 1D array [word, word, word, ...]
	this.wordArray = [];

	// array [canvas, canvas, canvas, ...]
	this.canvasArray = [];
	
	// Start with 1 empty smartcanvas
	this.canvasArray.push(new SmartCanvas('24px "Times New Roman"',this.defaultSize));	
}

TextureHolder.prototype.addImage = function(img, x, y, width, height){
	var latest = this.canvasArray[this.canvasArray.length-1];
	//this.canvasArray[this.canvasArray.length-1].drawImage(img, x, y, width, height);
	
	var latest = this.canvasArray[this.canvasArray.length-1];
	var testval = latest.testImage(width,height);
	var widthHeight;
	
	// Add to canvas according to testval
	if(testval !== -1){ // no need for new canvas
		widthHeight = latest.drawImage(img, x, y, width, height, testval);
	}
	else{ // need new canvas
		this.addCanvas();
		latest = this.canvasArray[this.canvasArray.length-1];
		widthHeight = latest.drawImage(img, x, y, width, height, testval);
	}
	
	// Add word to wordArray
	//this.wordArray.push(new Word("", latest, x, y, x, y, width, height));
	this.wordArray.push(new Word("", latest, x, y, widthHeight[0], widthHeight[1], latest.lastX-widthHeight[0], latest.lineHeight));
}

TextureHolder.prototype.addWord = function(text, x, y, gl){
	var testval = this.tryAdd(text);
	var latest = this.canvasArray[this.canvasArray.length-1];
	var widthHeight;
	
	// Add to canvas according to testval
	if(testval !== -1){ // no need for new canvas
		widthHeight = latest.writeWord(text, testval);
	}
	else{ // need new canvas
		this.addCanvas();
		latest = this.canvasArray[this.canvasArray.length-1];
		widthHeight = latest.writeWord(text, 0);
	}
	
	// Add word to wordArray
	this.wordArray.push(new Word(text, latest, x, y, widthHeight[0], widthHeight[1], latest.lastX-widthHeight[0], latest.lineHeight));
}

TextureHolder.prototype.tryAdd = function(text){
	return(this.canvasArray[this.canvasArray.length-1].testWord(text));
}

TextureHolder.prototype.addCanvas = function(gl){
	// Add a canvas
	// we should already know this.nextY so passing it saves us a calculation
	if(this.canvasArray[this.canvasArray.length-1].texUpdate === true){
		this.canvasArray[this.canvasArray.length-1].saveTexture(gl);
	}
	this.canvasArray.push(new SmartCanvas(this.getFont(),this.defaultSize,this.nextY));
}

TextureHolder.prototype.setFont = function(font){
	this.canvasArray[this.canvasArray.length-1].changeFont(font);
}

TextureHolder.prototype.getFont = function(){
	return(this.canvasArray[this.canvasArray.length-1].returnFont());
}

TextureHolder.prototype.getColor = function(){
	return(this.canvasArray[this.canvasArray.length-1].returnColor());
}

TextureHolder.prototype.setColor = function(color){
	this.canvasArray[this.canvasArray.length-1].changeColor(color);
}

TextureHolder.prototype.render = function(webglcanvas, gl){
	var lastCanvas = undefined;
	var needUpdate;
	for(var i=0; i<this.wordArray.length; i++){
		if(i==0){
			gl.bindTexture(gl.TEXTURE_2D, this.wordArray[i].canvas.texture);
		}
		
		// Actually write word. Other code for coordination
		this.wordArray[i].render(webglcanvas, needUpdate, gl);
		
		if(i !== 0 && i != this.wordArray.length-1){
			lastCanvas = this.wordArray[i+1].canvas.canvas;
		}
		else{
			lastCanvas = undefined;
		}
		if(lastCanvas !== this.wordArray[i].canvas.canvas){
			if(i+1 != this.wordArray.length){
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.wordArray[i+1].canvas.texture);
			numTexBind++;
			}
		}
		
	}
}

function Word(text, canvas, x, y, xc, yc, widthc, heightc){
	this.text = text; // text of the word
	this.canvas = canvas; // which SmartCanvas the word is in
	this.x = x; // x coordinate in webgl
	this.y = y; // y coordinate in webgl
	this.xc = xc; // x coordinate on the canvas
	this.yc = yc; // y coordinate on the canvas
	this.widthc = widthc; // width of text on canvas
	this.heightc = heightc; // height of text on canvas
	this.verticies;
	this.Tx = 0.0;
	this.Ty = 0.0;
}

Word.prototype.render = function (glcanvas, needUpdate, gl){
	// Make sure the texture is ready before any rendering
	this.canvas.saveTexture(gl);

	// Calculate WebGL verticies
	var tex00 = this.canvasToST(this.xc, this.yc);
	var tex01 = this.canvasToST(this.xc, this.yc+this.heightc);
	var tex10 = this.canvasToST(this.xc+this.widthc, this.yc);
	var tex11 = this.canvasToST(this.xc+this.widthc, this.yc+this.heightc);
	
	var cor00 = [this.x,this.y];
	var cor01 = [this.x,this.y+this.heightc];
	var cor10 = [this.x+this.widthc,this.y];
	var cor11 = [this.x+this.widthc,this.y+this.heightc];
	
	this.vertices = new Float32Array([
	// Vertex coordinates, texture coordinate
		cor00[0],  cor00[1],   tex00[0], tex00[1],
		cor01[0],  cor01[1],   tex01[0], tex01[1],
		cor10[0],  cor10[1],   tex10[0], tex10[1],
		cor11[0],  cor11[1],   tex11[0], tex11[1]
	]);
	
	// Pass the translation distance to the vertex shader
	 var u_Translation = gl.getUniformLocation(gl.program, 'u_Translation');
	 if (!u_Translation) {
		console.log('Failed to get the storage location of u_Translation');
		return;
	 }
	 gl.uniform4f(u_Translation, this.Tx, this.Ty, Tz, 0.0);
	
	// Render the array with vertices
	// This needs to be called each time
	gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

	var FSIZE = this.vertices.BYTES_PER_ELEMENT;
	//Get the storage location of a_Position, assign and enable buffer
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 4, 0);
	gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

	// Get the storage location of a_TexCoord
	var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
	if (a_TexCoord < 0) {
		console.log('Failed to get the storage location of a_TexCoord');
		return -1;
	}
	// Assign the buffer object to a_TexCoord variable
	gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 4, FSIZE * 2);
	gl.enableVertexAttribArray(a_TexCoord);  // Enable the assignment of the buffer object

	// Init Texture
	//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
	// Enable texture unit0
	//gl.activeTexture(gl.TEXTURE0);
	// Bind the texture object to the target
	//if(needUpdate === true){
	//	gl.bindTexture(gl.TEXTURE_2D, this.canvas.texture);
	//	numTexBind++;
	//}

	// Set the texture parameters
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
		if (!u_Sampler) {
		console.log('Failed to get the storage location of u_Sampler');
		return false;
	}

	// Set the texture unit 0 to the sampler
	gl.uniform1i(u_Sampler, 0);
	
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // Draw the rectangle
}

Word.prototype.canvasToST = function(x, y){
	var width = this.canvas.canvas.width;
	var height = this.canvas.canvas.height;
	var newX;
	var newY;

	// Convert from canvas to ST texture coordinates
	newX = x/width;
	newY = (height-y)/height; // broken
	//console.log(newX+" "+newY);
	return [newX,newY];
}

function SmartCanvas(font, size, height){
	// Add new hidden canvas element
	this.canvas = document.createElement("canvas");
	document.body.appendChild(this.canvas);
	this.canvas.height = size; // make sure size works for webgl texture
	this.canvas.width = size;  // ie a square of power of 2
	this.canvas.setAttribute("style", "visibility:hidden;"); // hide the canvas
	//if(DEBUG){
		this.canvas.setAttribute("style", "visibility:visible;"); // unhide the canvas
	//}
	// Font and alignment
	this.font = font;
	var ctx = this.canvas.getContext("2d");
	ctx.textBaseline="top"; //*** CRUCIAL CODE *** makes alignment standard
	ctx.font = font; // set canvas to start with this font
	this.color = "red";
	ctx.fillStyle = this.color;

	// Keep track of text locations
	// Start at top left corner and work our way down
	this.lastX = 0;
	this.lastY = 0;
	// If height is defined, we already know height of line
	if(height != undefined){
		this.nextY = height;
	}
	else{ // otherwise calculate it
		this.nextY = this.getFontHeight();
	}
	this.lineHeight = this.nextY; // used in case line shrinks

	// Texture for webgl use
	//this.texture; // don't define yet
	this.texUpdate = false; // true if we need to retexture on word add
}

SmartCanvas.prototype.drawImage = function(img, x, y, width, height, testval){
	var ctx = this.canvas.getContext("2d");
	
	
	var ctx = this.canvas.getContext("2d");
	var returnval = [this.lastX, this.lastY];
	// On this line
	if(testval === 0){
		ctx.drawImage(img, this.lastX, this.lastY, width, height);
		this.lastX += width;
	}
	// On next line
	else{
		this.lastX = 0;
		//this.lastY += this.nextY;
		this.lastY += this.nextY;
		this.nextY = height;
		//this.nextY = this.lineHeight;
		returnval = [this.lastX, this.lastY]; // update return val
		ctx.drawImage(img, this.lastX, this.lastY, width, height);
		this.lastX += width;
	}

	// Let renderer know this canvas has been edited since last texture
	this.texUpdate = true;

	// return [x,y] start location of text
	return returnval;
}

SmartCanvas.prototype.testImage = function(width, height){
	var ctx = this.canvas.getContext("2d");
	//New canvas needed? eg. font size change
	if(this.canvas.height < height + this.lastY){ // is there room this line?
		return -1; // new canvas
	}

	if((this.canvas.width - this.lastX) < width){ // new line needed?
		if(this.canvas.height < this.lastY+ this.nextY + height){ // is there room next line?
			return -1; // new canvas
		}
		else{
			return 1; // new line
		}
	}
	else{ // just write
		return 0;
	}
}

SmartCanvas.prototype.testWord = function(text){
	var ctx = this.canvas.getContext("2d");
	//New canvas needed? eg. font size change
	if(this.canvas.height < this.nextY + this.lastY){ // is there room this line?
		return -1; // new canvas
	}

	if((this.canvas.width - this.lastX) < ctx.measureText(text).width){ // new line needed?
		if(this.canvas.height < this.lastY+ this.nextY + this.nextY){ // is there room next line?
			return -1; // new canvas
		}
		else{
			return 1; // new line
		}
	}
	else{ // just write
		return 0;
	}
}
// WriteWord() writes a word to canvas in next available space
// returns canvas coordinates the word is located [x, y]
// To find quadrilateral: width, height, lastX, nextY
SmartCanvas.prototype.writeWord = function(text, testval){
	var ctx = this.canvas.getContext("2d");
	var wordWidth = ctx.measureText(text).width;
	var returnval = [this.lastX, this.lastY];
	// On this line
	if(testval === 0){
		ctx.fillText(text, this.lastX, this.lastY);
		this.lastX += wordWidth;
	}
	// On next line
	else{
		this.lastX = 0;
		//this.lastY += this.nextY;
		this.lastY += this.nextY;
		this.nextY = this.lineHeight;
		//this.nextY = this.lineHeight;
		returnval = [this.lastX, this.lastY]; // update return val
		ctx.fillText(text, this.lastX, this.lastY);
		this.lastX += wordWidth;
	}

	// Let renderer know this canvas has been edited since last texture
	this.texUpdate = true;

	// return [x,y] start location of text
	return returnval;
}
//		changeFont()
SmartCanvas.prototype.changeFont = function(font){
	//console.log("changefont: "+font);
	this.font = font;
	var ctx = this.canvas.getContext("2d");
	ctx.textBaseline="top"; //*** CRUCIAL CODE *** makes alignment standard
	ctx.font = font;

	// Make sure to update nextY if font size is smaller
	var tempHeight = this.getFontHeight();
	this.lineHeight = tempHeight;
	if(this.nextY < tempHeight){
		this.nextY = tempHeight;
	}
}

SmartCanvas.prototype.changeColor = function(color){
	var ctx = this.canvas.getContext("2d");
	ctx.fillStyle = color;
}

//		returnFont()
SmartCanvas.prototype.returnFont = function(){
	return(this.font);
}

SmartCanvas.prototype.returnColor = function(){
	return(this.canvas.getContext("2d").fillStyle);
}

//		getFontHeight() gets height of font when font is changed
// Adapted from this stackoverflow answer by Michaelangelo:
//http://stackoverflow.com/questions/11452022/measure-text-height-on-an-html5-canvas-element
// 1) create div with word and font used in canvas
// 2) measure div
// 3) remove div
SmartCanvas.prototype.getFontHeight = function(){
	//console.log("getfontheight: "+this.font);
	var div = document.createElement("div");
	div.style.position = 'absolute'; // required for making div start out small as possible
	//div.style.left = '-999px';
	//div.style.top = '-999px';
	div.innerHTML = "Hg"; // High and Low letters. Also mercury.
	//var ctx = this.canvas.getContext("2d");
	var font = "font: "+this.font+";";
	div.setAttribute("style", font);
	document.body.appendChild(div);
	var size = [div.offsetWidth, div.offsetHeight]; // keep this in case width is needed later
	document.body.removeChild(div);
	return size[1];
}
// This function saves a WebGL texture to this.texture
// Without a texture, we cannot render textures
SmartCanvas.prototype.saveTexture = function(gl){
	// Create a new texture only once
	if(!this.texture){
		// create texture here	
		this.texture = gl.createTexture();   // Create a texture object
		numTexCreate++;
			if (!this.texture) {
				console.log('Failed to create the texture object');
				return false;
			}
		}
		
	
	// Update texture only when needed
	if(this.texUpdate === true){
		// Ready texture binding
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
		gl.activeTexture(gl.TEXTURE0); // Enable texture unit0
		gl.bindTexture(gl.TEXTURE_2D, this.texture); // Bind the texture object to the target

		// Set the texture properties
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		// Set the texture canvas
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);
		numTexLoad++;
		
		// Mark as updated
		this.texUpdate = false;
	}
}