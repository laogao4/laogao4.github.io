$(function() {
	var isChrome = window.google || window.chrome;
	if (!isChrome) {
		alert('请使用chrome浏览器');
		return;
	}
	BLUR = false;
	PULSATION = true;
	PULSATION_PERIOD = 600;
	PARTICLE_RADIUS = 4;
	/* disable blur before using blink */
	BLINK = false;
	GLOBAL_PULSATION = false;
	QUALITY = 2; /* 0 - 5 */
	/* set false if you prefer rectangles */
	ARC = true;
	/* trembling + blur = fun */
	TREMBLING = 0; /* 0 - infinity */
	FANCY_FONT = "Arial";
	BACKGROUND = "#000";// "#DF1422";
	BLENDING = true;
	/* if empty the text will be a random number */
	var TEXT;
	num = 0;// 当前显示的文字序号
	TEXTArray = [ "To L&W", "新婚快乐", "早生贵子", "白头偕老", "天长地久" ];

	QUALITY_TO_FONT_SIZE = [ 10, 12, 40, 50, 100, 350 ];
	QUALITY_TO_SCALE = [ 20, 6, 2.5, 2, 0.9, 0.5 ];
	QUALITY_TO_TEXT_POS = [ 10, 20, 60, 100, 370, 280 ];

	window.onload = function() {
		var canvas = document.getElementById("canvas");
		var ctx = canvas.getContext("2d");

		var W = canvas.width;
		var H = canvas.height;

		total_area = W * H;
		total_particles = 2028;// 粒子数量
		single_particle_area = total_area / total_particles;
		area_length = Math.sqrt(single_particle_area);

		var particles = [];
		for (var i = 1; i <= total_particles; i++) {
			particles.push(new particle(i));
		}

		function particle(i) {
			this.r = Math.round(Math.random() * 255 | 0);
			this.g = Math.round(Math.random() * 255 | 0);
			this.b = Math.round(Math.random() * 255 | 0);
			this.alpha = 1;

			this.x = (i * area_length) % W;
			this.y = (i * area_length) / W * area_length;

			/* randomize delta to make particles sparkling */
			this.deltaOffset = Math.random() * PULSATION_PERIOD | 0;

			this.radius = 0.5 + Math.random() * 1.0;
		}

		var positions = [];

		function new_positions() {
			TEXT = TEXTArray[num];

			if (num < TEXTArray.length - 1) {
				num++;
			} else {
				num = 0;
			}
			ctx.globalCompositeOperation = "source-over";// 新图形绘制于已有图形的顶部
			ctx.strokeRect(0, 0, W, H);
			ctx.font = "bold " + QUALITY_TO_FONT_SIZE[QUALITY] + "px " + FANCY_FONT;
			// tctx.textAlign='center';//文本水平对齐方式
			// tctx.textBaseline='middle';

			// tctx.strokeStyle = "black";
			ctx.fillStyle = "#010101";
			// ctx.strokeText(TEXT,30, 50);
			ctx.fillText(TEXT, 20, 60);
			image_data = ctx.getImageData(0, 0, W, H);
			pixels = image_data.data;
			positions = [];
			for (var i = 0; i < pixels.length; i = i + 4) {
				if (pixels[i] == 1 && pixels[i + 1] == 1 && pixels[i + 2] == 1) {
					positions.push({
						x : (i / 2 % W | 0) * QUALITY_TO_SCALE[QUALITY] | 0,
						y : (i / 2 / W | 0) * QUALITY_TO_SCALE[QUALITY] | 0
					});
				}
			}
			get_destinations();
		}

		function draw() {
			var now = Date.now();

			ctx.globalCompositeOperation = "source-over";

			if (BLUR)
				ctx.globalAlpha = 0.1;
			else if (!BLUR && !BLINK)
				ctx.globalAlpha = 1.0;

			ctx.fillStyle = BACKGROUND;//
			ctx.fillRect(0, 0, W, H);

			if (BLENDING)
				ctx.globalCompositeOperation = "lighter";

			for (var i = 0; i < particles.length; i++) {

				p = particles[i];

				if (p.alpha == 0)
					continue;

				/*
				 * in lower qualities there is not enough full pixels for all of
				 * them - dirty hack
				 */

				if (isNaN(p.x))
					continue;
				ctx.beginPath();
				ctx.fillStyle = "rgb(" + p.r + ", " + p.g + ", " + p.b + ")";
				// ctx.fillStyle = "rgba(" + p.r + ", " + p.g + ", " + p.b + ",
				// " + p.alpha + ")";

				if (BLINK)
					ctx.globalAlpha = Math.sin(Math.PI * mod * 1.0);

				if (PULSATION) { /* this would be 0 -> 1 */
					var mod = ((GLOBAL_PULSATION ? 0 : p.deltaOffset) + now) % PULSATION_PERIOD / PULSATION_PERIOD;

					/* lets make the value bouncing with sinus */
					mod = Math.sin(mod * Math.PI);
				} else
					var mod = 1;

				var offset = TREMBLING ? TREMBLING * (-1 + Math.random() * 2) : 0;

				var radius = PARTICLE_RADIUS * p.radius;

				if (!ARC) {
					ctx.fillRect(offset + p.x - mod * radius / 2 | 0, offset + p.y - mod * radius / 2 | 0, radius * mod, radius * mod);
				} else {
					ctx.arc(offset + p.x | 0, -120 + offset + p.y | 0, 0.1 + radius * mod, Math.PI * 2, false);
					ctx.fill();
				}

				p.x += (p.dx - p.x) / 10;
				p.y += (p.dy - p.y) / 10;
			}
		}

		function get_destinations() {
			var posNum = 0;
			for (var i = 0; i < particles.length; i++) {
				pa = particles[i];
				pa.alpha = 1;
				var temp = (posNum++) % positions.length;
				po = positions[temp];
				particles[i].dx = positions[temp].x;
				particles[i].dy = positions[temp].y;
				particles[i].distance = Math.sqrt((pa.x - po.x) * (pa.x - po.x) + (pa.y - po.y) * (pa.y - po.y));
				// positions.splice(temp, 1);
			}
		}

		function rotate(deg) {
			return {
				'transform' : 'rotate(' + deg + 'deg)',
				'-ms-transform' : 'rotate(' + deg + 'deg)', /* IE 9 */
				'-moz-transform' : 'rotate(' + deg + 'deg)', /* Firefox */
				'-webkit-transform' : 'rotate(' + deg + 'deg)', /*
																 * Safari and
																 * Chrome
																 */
				'-o-transform' : 'rotate(' + deg + 'deg)' /* Opera */
			};
		}

		function init() {
			$("canvas").css({
				filter : 'alpha(opacity=80)', // * ie 有效
				'-moz-opacity' : 0.8,// * Firefox 有效
				opacity : 0.8
			});
			new_positions();
			changeBG();
			setInterval(draw, 20);
			setInterval(new_positions, 4000);
			setInterval(changeBG, 4000);
			changeJP();
			setInterval(changeJP, 1000);
		}

		var images = [];
		var marginTop = [ -150, -250, -520, -180, -380 ];// 图片向上移动的距离
		for (var i = 1; i < 6; i++)
			images.push('img/' + i + '.jpg');
		var imagePos = 0;
		function changeBG() {
			return;
			var totalW = $(document).width();
			var totalH = $(document).height();
			$("#imgDiv").animate({
				'filter' : 'alpha(opacity=0)', /* ie 有效 */
				'-moz-opacity' : 0,/* Firefox 有效 */
				'opacity' : 0,
				'margin-top' : marginTop[imagePos]
			}, 'slow', function() {
				$("#bgImg").attr({
					src : images[imagePos],
					width : totalW
				});
				$("#imgDiv").animate({
					'filter' : 'alpha(opacity=100)', /* ie 有效 */
					'-moz-opacity' : 1,/* Firefox 有效 */
					'opacity' : 1
				}, 'slow');
				imagePos++;
				if (imagePos >= images.length)
					imagePos = 0;
			});
		}
		// 修改胶片
		var smallImgPos = 0;
		function changeJP() {
			if (smallImgPos == 112) {
				smallImgPos = 0;
			}
			var src = 'smallImg/psb(' + smallImgPos + ').jpg';
			$('#testImg').attr({
				src : src
			});
			$("#smallImgDiv").append("<img class='jpImg' style='height:76px;' src='" + src + "' />");
			if ($("#smallImgDiv").width() > $(document).width() + 100) {
				$("#smallImgDiv img:first").animate({
					height : '0px'
				}, 500, function() {
					$("#smallImgDiv img:first").remove();
				});
			} else
				$("#smallImgDiv").animate({
					// 'margin-left' : $("#smallImgDiv").css('margin-left')
					// * 1
					// +
					// $("#smallImgDiv img:last").width() * (-1),
					'width' : parseFloat($("#smallImgDiv").css('width')) + $('#testImg').width(),
				});
			smallImgPos++;
		}
		init();
	};
});
