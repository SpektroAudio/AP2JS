
/*

PONG FOR PUSH 2 + AP2JS

DEVELOPED BY SPEKTRO AUDIO
http://spektroaudio.com/


*/

inlets = 1;
outlets = 2;


ball_pos = [1,2]
ball_dir = [1,1]
p1_pos = 0;
p2_pos = 0;
p_color = [12, 24]
round_number = 0;
validgame = false;

outlet(0, "clear_all");

function p1_height(x) {
	if (x > 5) {
		x = 5;
	};
	if (x < 0) {
		x = 0;
	}
	format = [1, 1, 1]
	for (var i = 0; i < x; i++) {
		format.push(0);
	}
	formatBin = format.join("")
	formatBinFinal = parseInt(formatBin, 2).toString(10);
	outlet(0, "set_column_b", 0, parseInt(formatBinFinal));
	p1_pos = x;
}

function p2_height(x) {
	if (x > 5) {
		x = 5;
	};
	if (x < 0) {
		x = 0;
	}
	format = [1, 1, 1]
	for (var i = 0; i < x; i++) {
		format.push(0);
	}
	formatBin = format.join("")
	formatBinFinal = parseInt(formatBin, 2).toString(10);
	outlet(0, "set_column_b", 7, parseInt(formatBinFinal));
	p2_pos = x;
}

function reset_ball() {
	if (validgame == false) {
	outlet(0, "set_pad", ball_pos[0], ball_pos[1], 0);
	round_number += 1
	if (round_number > 8) {
		round_number = 0;
		for (var i = 1; i < 9; i++) {
			outlet(0, "set_button", "scene_" + i, 0)
		}
	}
	ball_pos = [3,3];
	ball_dir = [rand_dir(), rand_dir()]
	validgame = true;
	}
}

function move_ball(){
	// clear previous pad
	outlet(0, "set_pad", ball_pos[0], ball_pos[1], 0);
	
	if (validgame == true) {
		
	// horizontal move
	ball_pos[0] = ball_pos[0] + ball_dir[0];
	
	if (ball_pos[0] > 6) {
		if (ball_pos[1] >= p2_pos && ball_pos[1] < (p2_pos + 3)) {
			post("\n", "ball:", ball_pos[1], "p2", p2_pos, p2_pos +3);
			ball_dir[0] = ball_dir[0] * -1
			ball_pos[0] = 6;
		}
		else {
			post("\n", "PLAYER 1 WINS")
			add_score(0);
			validgame = false;
			outlet(1, 0);
		}
	}
	else if (ball_pos[0] < 1) {
		if (ball_pos[1] >= p1_pos && ball_pos[1] < (p1_pos + 3)) {
			post("\n", "ball:", ball_pos[1], "p2", p1_pos, p1_pos +3);
			ball_dir[0] = ball_dir[0] * -1
			ball_pos[0] = 1;
		}
		else {
			post("\n", "PLAYER  WINS")
			validgame = false;
			add_score(1);
			outlet(1, 0);
		}
	}
	
	// vertical move
	ball_pos[1] = ball_pos[1] + ball_dir[1];
	
	if (ball_pos[1] > 7) {
		ball_dir[1] = ball_dir[1] * -1
		ball_pos[1] = 6;
	}
	else if (ball_pos[1] < 0) {
		ball_dir[1] = ball_dir[1] * -1
		ball_pos[1] = 1;
	}
	
	post("\n", "ball_pos:", ball_pos);
	outlet(0, "set_pad", ball_pos[0], ball_pos[1], 125);
	}
}

function rand_dir() {
	v = Math.random()
	if (v > 0.5) {
		return 1;
	} else {
		return -1;
	}
}

function add_score(p) {
	if (round_number > 0 && round_number < 9) {
		outlet(0, "set_button", "scene_" + round_number, p_color[p])
	}
}
