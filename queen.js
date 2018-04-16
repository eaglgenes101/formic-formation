//The queen 

//Opening-phase queen (when the gatherer is not visible and the queen has no food)
function opening_queen()
{

	//If one of the adjacent spaces has food, gather it
	for (try_cell of rand_perm(SCAN_MOVES))
		if (view[try_cell].food === 1) return {cell:try_cell};

	//Actively avoid other workers
	for (try_cell of rand_perm(SCAN_MOVES))
		if (view[try_cell].ant !== null) return {cell:CCW[try_cell][4]};

	if (this_ant().food > 0) 
	{
		var num_allies = 0;
		for (try_cell of SCAN_MOVES)
			if (is_ally(try_cell)) num_allies++;
		if (num_allies === 0) 
		{
			//Check the area for clearings
			var is_clear = true;
			var num_black_corners = 0;
			for (var try_cell = 0; try_cell < 9; try_cell++)
			{
				if (CORNERS.includes(try_cell))
				{
					if (view[try_cell].color === 8) num_black_corners++;
					else if (view[try_cell].color !== 1) is_clear = false;
				}
				else if (view[try_cell].color !== 1) is_clear = false;
			}
			if (num_black_corners === 1 && is_clear) return {cell:0, type:GATHERER};
		}
	}

	if (view[4].color !== 8) return {cell:4, color: 8};

	for (try_cell of rand_perm(CORNERS))
		if (view[try_cell].color === 1 && view[CCW[try_cell][4]].color !== 1) return {cell:try_cell};
	for (try_cell of rand_perm(CORNERS))
		if (view[try_cell].color === 1 && view[CCW[try_cell][2]].color !== 1 && view[CCW[try_cell][6]].color !== 1) 
			return {cell:try_cell};

	return {cell:0};
	
}

//Early-phase queen (when the queen and the gatherer are moving together at lightspeed, trying to find more food)
function early_queen()
{
	//Find the gatherer, revolve counterclockwise around her
	var gatherer_cell = null;
	var ally_count = 0;
	for (try_cell of rand_perm(SCAN_MOVES))
	{
		if (is_ally(try_cell))
		{
			ally_count++;
			if (view[try_cell].ant.type === GATHERER && EDGES.includes(try_cell)) gatherer_cell = try_cell;
		}
	}

	if (gatherer_cell === null) 
		return opening_queen();

	for (try_cell of rand_perm(CORNERS))
		if (view[try_cell].food > 0) 
		{
			if (view[try_cell].color !== D_FOOD) return {cell:try_cell, color:D_FOOD};
			else if (NEARS[try_cell].includes(gatherer_cell)) return {cell:try_cell};
		}
	for (try_cell of rand_perm(EDGES))
		if (view[try_cell].food > 0) 
		{
			if (view[try_cell].color !== D_FOOD) return {cell:try_cell, color:D_FOOD};
			else return {cell:4, color: D_MARCH};
		}

	//To prevent gliding spins, color our own cell white if it's yellow
	if (view[4].color === D_FOOD) 
	{
		if (view[CCW[gatherer_cell][2]].color === D_FOOD && view[CCW[gatherer_cell][2]].food === 0)
			return {cell:CCW[gatherer_cell][2], color:D_MARCH};
		return {cell:4, color:D_MARCH};
	}

	if (view[CCW[gatherer_cell][6]].color === D_FOOD && view[CCW[gatherer_cell][6]].food === 0)
		return {cell:CCW[gatherer_cell][6], color:D_MARCH};

	//Once the gatherer is orthogonal to us, spawn a marcher with reasonable probability
	if (EDGES.includes(gatherer_cell) && this_ant().food > 2 && ally_count === 1) 
	{
		var num_clear_cells = 0;
		var num_down_food = 0;
		var is_valid = true;
		for (var try_cell = 0; try_cell < 9; try_cell++)
		{
			if (view[try_cell].color === D_FOOD) 
			{
				num_down_food++;
				if (try_cell !== 4 && try_cell !== gatherer_cell) is_valid = false;
			}
			if (view[try_cell].color === D_MARCH) num_clear_cells++;
		}
		if (is_valid && num_down_food === 1 && num_clear_cells === 8)
		{
			var food_factor = QUEEN_FORM_PROB_MAX-QUEEN_FORM_PROB_MIN
			var food_coefficient = QUEEN_FORM_PROB_DECAY/food_factor
			var actual_prob = food_factor/(food_coefficient*(this_ant().food-3)+1) + QUEEN_FORM_PROB_MIN;

			if (rand_choice(actual_prob)) return {cell:CCW[gatherer_cell][1], type:rand_choice(.5)?MARCHER_A:MARCHER_B};
			else return {cell:gatherer_cell, color:D_MARCH};
		}
	}

	return {cell:CCW[gatherer_cell][7]};
}

//Don't step on food or enemies. Instead, signal. 
function qwatch(candidate)
{
	if (candidate.hasOwnProperty("type") && this_ant().food === 0) return sigc2(U_PANIC, 0); 
	if (candidate.cell === 4) return candidate;
	if (candidate.hasOwnProperty("color")) return candidate;
	if (is_enemy(candidate.cell)) return sigc2(U_PANIC, 0); 
	if (is_ally(candidate.cell)) return sigc2(view[4].color, 0); 
	return candidate;
}

function qdec_two_edge_straight(c)
{
	//Don't fight the gatherer
	return sigc2(view[4].color, c); 
}

function qdec_two_edge_bent(c)
{
	return {cell:CCW[c][2]};
}

function qdec_edge_corner_skewed(c)
{
	if (view[c].ant.type === MARCHER_A) return {cell:CCW[c][7], type:MARCHER_B};
	if (view[c].ant.type === MARCHER_B) return {cell:CCW[c][7], type:MARCHER_A};
	return sanitize(opening_queen(), FREE_ORDER);
}

function qdec_edge_corner_spawn(c)
{
	if (view[c].ant.type === MARCHER_A) return {cell:CCW[c][1], type:MARCHER_B};
	if (view[c].ant.type === MARCHER_B) return {cell:CCW[c][1], type:MARCHER_A};
	return sanitize(opening_queen(), FREE_ORDER);
}

function qdec_two_corner_edged(c)
{
	if (view[CCW[c][2]].ant.type === MARCHER_A) return {cell:CCW[c][1], type:MARCHER_B};
	if (view[CCW[c][2]].ant.type === MARCHER_B) return {cell:CCW[c][1], type:MARCHER_A};
	return sanitize(opening_queen(), FREE_ORDER);
}

function qdec_three_march(c)
{
	var u_sig = PAIRUPS[view[c].color][view[CCW[c][1]].color];
	if (u_sig === D_STALLED)
	{
		if (view[CCW[c][3]].color === D_MARCH && [D_MARCH, D_GATHERER].includes(view[4].color))
			return sigc(D_STALLED, c); 
		if (view[CCW[c][3]].color === U_READY && view[4].color === D_STALLED)
			return sigc(U_READY, c); 
	}
	if (u_sig === D_MARCH && view[CCW[c][3]].color === U_READY && view[4].color === U_READY)
		return sigc(D_MARCH, c); 
	if (u_sig === U_READY && view[CCW[c][3]].color === U_REALIGN && view[4].color === U_READY)
		if (view[CCW[c][1]].color === D_MARCH)
			return sigc(D_MARCH, c); 

	//Now with those found
	return sigc(view[4].color, c); 
}

function qdec_three_stand(c)
{
	var u_sig = PAIRUPS[view[c].color][view[CCW[c][7]].color];
	if (u_sig === D_STALLED)
	{
		if (view[CCW[c][3]].color === D_MARCH && view[4].color === D_GATHERER)
			return sigc(D_STALLED, c); 
		if (view[CCW[c][3]].color === U_READY && view[4].color === D_STALLED)
			return sigc(U_READY, c); 
	}
	if (u_sig === D_MARCH && view[CCW[c][3]].color === U_READY && view[4].color === U_READY)
		return sigc(D_MARCH, c); 
	if (u_sig === U_READY && view[CCW[c][3]].color === U_REALIGN && view[4].color === U_READY)
		if (view[CCW[c][1]].color === D_MARCH)
			return sigc(D_MARCH, c); 

	//Now with those found
	return sigc(view[4].color, c); 
}

function qdec_three_recover(c)
{
	var u_sig = PAIRUPS[view[c].color][view[CCW[c][1]].color];
	if (u_sig === D_FOOD) return sigc(D_FOOD, c); 
	
	//With probability, spawn a worker. 
	if (this_ant().food > 0 && [D_STALLED, U_READY].includes(u_sig))
	{
		var one_minus_prob = 1-QUEEN_SPAWN_PROB_MIN
		var food_coefficient = QUEEN_SPAWN_PROB_DECAY/one_minus_prob
		var actual_prob = one_minus_prob/(food_coefficient*(this_ant().food-1)+1) + QUEEN_SPAWN_PROB_MIN;
		if (rand_choice(actual_prob)) return {cell:CCW[c][3]};
	}

	var provisional = linewatch(c)
	if (provisional !== null) return sigc(provisional, c);
	return sigc(view[4].color, c);
}

function qdec_three_unstand(c)
{
	var u_sig = PAIRUPS[view[c].color][view[CCW[c][7]].color];

	if (this_ant().food > 0 && u_sig === D_STALLED && view[CCW[c][5]].color === D_MARCH && view[4].color === D_STALLED)
	{
		//Initiate off-phase spawning
		var one_minus_prob = 1-QUEEN_SPAWN_PROB_MIN
		var food_coefficient = QUEEN_SPAWN_PROB_DECAY/one_minus_prob
		var actual_prob = one_minus_prob/(food_coefficient*(this_ant().food-1)+1) + QUEEN_SPAWN_PROB_MIN;
		if (rand_choice(actual_prob)) return {cell:CCW[c][3]};
	}

	//Reply to stalled with ready
	if (u_sig === D_STALLED && view[CCW[c][5]].color === U_READY && view[4].color === D_STALLED)
		return sigc(U_READY, c); 

	return sigc(u_sig, c); 
}

function qdec_three_block(c)
{
	var u_sig = PAIRUPS[view[c].color][view[CCW[c][1]].color];
	return sigc(u_sig, c); 
}

function qdec_three_side(c)
{
	var u_sig = PAIRUPS[view[CCW[c][1]].color][view[CCW[c][2]].color];
	return sigc(u_sig, CCW[c][2]); 
}

function queen_wait()
{
	var c = view_corner();
	switch(neighbor_type(c))
	{
		case ONE_EDGE:
		{
			if (this_ant().food > 1) return {cell:CCW[c][3], type:GATHERER};
		}
		break;
		case EDGE_CORNER_LEFT:
		{
			var u_sig = PAIRUPS[view[c].color][view[CCW[c][1]].color];
			if (u_sig === D_GATHERER) return sigc(D_GATHERER, c); 
			if (u_sig === U_REALIGN && [U_REALIGN, U_SENTINEL].includes(view[c].color))
				if ([U_REALIGN, U_SENTINEL].includes(view[CCW[c][1]].color))
					return sanitize(early_queen(), LEFT_ORDER);
			var provisional = linewatch(c);
			if (provisional !== null) return sigc(provisional, c); 
			if (this_ant().food > 1) 
			{
				if (view[CCW[c][3]].color !== D_MARCH) return {cell:CCW[c][3], color:D_MARCH};
				return {cell:CCW[c][3], type:GATHERER};
			}
		}
		break;
		case EDGE_CORNER_RIGHT:
		{
			var u_sig = PAIRUPS[view[c].color][view[CCW[c][7]].color];
			if (u_sig === D_GATHERER) return sigc(D_GATHERER, c); 
			if (u_sig === U_REALIGN && [U_REALIGN, U_SENTINEL].includes(view[c].color))
				if ([U_REALIGN, U_SENTINEL].includes(view[CCW[c][7]].color))
					return sanitize(early_queen(), LEFT_ORDER);
			var provisional = linewatch(c);
			if (provisional !== null) return sigc(provisional, c); 
			if (this_ant().food > 1) 
			{
				if (view[CCW[c][5]].color !== D_MARCH) return {cell:CCW[c][5], color:D_MARCH};
				return {cell:CCW[c][5], type:GATHERER};
			}
		}
		break;
	}

	if (view[4].color !== U_PANIC) return sigc2(U_PANIC, c); 
	else return sanitize(opening_queen(), FREE_ORDER);
}

function queen_march()
{
	var c = view_corner();
	switch (neighbor_type(c))
	{
		case TWO_EDGE_STRAIGHT: return qwatch(qdec_two_edge_straight(c));
		case TWO_EDGE_BENT: return qwatch(qdec_two_edge_bent(c));
		case EDGE_CORNER_SKEWED: return qwatch(qdec_edge_corner_skewed(c));
		case EDGE_CORNER_SPAWN: return qwatch(qdec_edge_corner_spawn(c));
		case TWO_CORNER_EDGED: return qwatch(qdec_two_corner_edged(c));
		case THREE_MARCH: return qwatch(qdec_three_march(c));
		case THREE_STAND: return qwatch(qdec_three_stand(c));
		case THREE_RECOVER: return qwatch(qdec_three_recover(c));
		case THREE_UNSTAND: return qwatch(qdec_three_unstand(c));
		case THREE_BLOCK: return qwatch(qdec_three_block(c));
		case THREE_SIDE: return qwatch(qdec_three_side(c));
		default: return sanitize(early_queen(), LEFT_ORDER);
	}
}

function queen_decision()
{
	marcher_count = 0;
	gatherer_count = 0;
	excess_gatherers = 0;
	for (try_cell of SCAN_MOVES)
	{
		if (is_ally(try_cell))
		{
			if (view[try_cell].ant.type === MARCHER_A || view[try_cell].ant.type === MARCHER_B) marcher_count++;
			if (view[try_cell].ant.type === GATHERER)
			{
				if (EDGES.includes(try_cell) || is_gatherer_marcher(try_cell)) gatherer_count++;
				else excess_gatherers++;
			}
		}
		else if (is_enemy(try_cell)) return sanitize(opening_queen(), FREE_ORDER);
	}
	if (marcher_count > 0 && gatherer_count === 1 && excess_gatherers === 0) return qwatch(queen_march());
	else if (marcher_count > 0 && gatherer_count === 0 && excess_gatherers === 0) return qwatch(queen_wait());
	else if (gatherer_count === 1 && excess_gatherers === 0) return sanitize(early_queen(), RIGHT_ORDER);
	else return sanitize(opening_queen(), FREE_ORDER);
}
