# SlothGL: WebGL for the Lazy
To use, place the SlothGL.js file in your directory and add place it in a script tag.

Using is easy:<br />
1) Make a canvas where you want to render WebGL <br />
2) Create a SlothGL object. <br />
	var renderer = new SlothGL();<br />
3) Call the setup() method with your canvas <br />
	renderer.setup(canvas);<br />
4) The following functions similar to the 2D canvas using the same familiar coordinate system <br />
	setFont()<br />
	setColor()<br />
	fillText(text, x, y)<br />
	drawImage(img, x, y, width, height)<br />
5) Call the render() method to display your work! <br />
	renderer.render();

# 3DText
Testing normal text rendering in WebGL
(maybe should have named this WebGLText)

Contents:
#spritesheet.html:
- Currently most advanced text rendering system
- Packs many words into textures and renders portions of each texture


#3DText.html:
- First attempt rendering words with webgl


#traslationtest.html:
- First animated program


#fpstest.html:
- General WebGL feature testing program
- Not directly related to text rendering
- Use mouse to add points to the webgl array
    (click 3 different spots to see a triangle)
- Use controls to alter how those points are rendered
- Maybe learn a bit about webgl


#TextClass.html:
- First attempt at making my text rendering system more object oriented
- Has some controls as well