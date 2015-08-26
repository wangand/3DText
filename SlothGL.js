SlothGL = function(){
	// Shaders
	this.vshader = 
		'attribute vec4 a_Position;\n' +
		'uniform mat4 u_xformMatrix;\n' +
		'void main() {\n' +
		'  gl_Position = u_xformMatrix * a_Position;\n' +
		'}\n';
	this.fshader = 
		'void main() {\n' +
		'  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
		'}\n';
	
	// WebGL program
	this.gl;
	
	// Text and Images stored here
	this.textures;
	
	// Projection matrix to give 2D-canvas-like coordinates
	// Default as identity matrix
	this.projectionMatrix = new Float32Array([
		1.0,  0.0, 0.0, 0.0,
		0.0,  1.0, 0.0, 0.0,
		0.0,  0.0, 1.0, 0.0,
		0.0,  0.0, 0.0, 1.0
	]);
}

SlothGL.prototype.hello = function(){
	console.log("SlothGL: WebGL for the lazy");
}

SlothGL.prototype.setup = function(canvas){
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