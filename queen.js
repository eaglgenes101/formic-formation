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
		if (view[try_cell].color !== 8 && view[CCW[try_cell][4]].color === 8) return {cell:try_cell};
	for (try_cell of rand_perm(CORNERS))
		if (view[try_cell].color !== 8 && view[CCW[try_cell][2]].color === 8 && view[CCW[try_cell][6]].color === 8) 
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

	for (try_cell of rand_perm(SCAN_MOVES))
		if (view[try_cell].food > 0) 
		{
			if (view[try_cell].color !== D_FOOD && NEARS[try_cell][gatherer_cell] === 2) 
				return {cell:try_cell, color:D_FOOD};
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
			var food_factor = QFORMP_MAX-QFORMP_MIN
			var food_coefficient = QFORMP_DECAY/food_factor
			var actual_prob = food_factor/(food_coefficient*(this_ant().food-3)+1) + QFORMP_MIN;

			if (rand_choice(actual_prob)) return {cell:CCW[gatherer_cell][1], type:rand_choice(.5)?MARCHER_A:MARCHER_B};
			else return {cell:gatherer_cell, color:D_MARCH};
		}
	}

	return {cell:CCW[gatherer_cell][7]};
}

//Don't step on food or enemies. Instead, signal. 
function qwatch(candidate)
{
	if (candidate.hasOwnProperty("type") && this_ant().food === 0) return sigc(U_PANIC, S_SIDE, 0); 
	if (candidate.hasOwnProperty("type") && view[candidate.cell].food !== 0) return sigc(U_PANIC, S_SIDE, 0);
	if (candidate.cell === 4) return candidate;
	if (candidate.hasOwnProperty("color")) return candidate;
	if (is_enemy(candidate.cell)) return sigc(U_PANIC, S_SIDE, 0); 
	if (is_ally(candidate.cell)) return sigc(view[4].color, S_SIDE, 0); 
	return candidate;
}

function qdec_ee_straight(c)
{
	//Don't fight the gatherer
	return sigc(view[4].color, S_SIDE, c); 
}

function qdec_ee_bent(c)
{
	return {cell:CCW[c][2]};
}

function qdec_ec_skewed(c)
{
	if (view[c].ant.type === MARCHER_A) return {cell:CCW[c][7], type:MARCHER_B};
	if (view[c].ant.type === MARCHER_B) return {cell:CCW[c][7], type:MARCHER_A};
	return sanitize(opening_queen(), FREE_ORDER);
}

function qdec_ec_spawn(c)
{
	if (view[c].ant.type === MARCHER_A) return {cell:CCW[c][1], type:MARCHER_B};
	if (view[c].ant.type === MARCHER_B) return {cell:CCW[c][1], type:MARCHER_A};
	return sanitize(opening_queen(), FREE_ORDER);
}

function qdec_cc_edged(c)
{
	if (view[CCW[c][2]].ant.type === MARCHER_A) return {cell:CCW[c][1], type:MARCHER_B};
	if (view[CCW[c][2]].ant.type === MARCHER_B) return {cell:CCW[c][1], type:MARCHER_A};
	return sanitize(opening_queen(), FREE_ORDER);
}

function qdec_three_march(c)
{
	var u_sig = PUPS[view[c].color][view[CCW[c][1]].color];
	if (u_sig === D_STALLED)
	{
		if (view[CCW[c][3]].color === D_MARCH && [D_MARCH, D_GATHERER].includes(view[4].color)) 
			return sigc(D_STALLED, S_FRONT, c); 
		if (view[CCW[c][3]].color === U_READY && view[4].color === D_STALLED) return sigc(U_READY, S_FRONT, c); 
	}
	if (u_sig === D_MARCH && view[CCW[c][3]].color === U_READY && view[4].color === U_READY)
		return sigc(D_MARCH, S_FRONT, c); 
	if (u_sig === U_READY && view[CCW[c][3]].color === U_REALIGN && view[4].color === U_READY)
		if (view[CCW[c][1]].color === D_MARCH) return sigc(D_MARCH, S_FRONT, c); 

	//Now with those found
	return sigc(view[4].color, S_FRONT, c); 
}

function qdec_three_stand(c)
{
	var u_sig = PUPS[view[c].color][view[CCW[c][7]].color];
	if (u_sig === D_STALLED)
	{
		if (view[CCW[c][3]].color === D_MARCH && view[4].color === D_GATHERER) return sigc(D_STALLED, S_FRONT, c); 
		if (view[CCW[c][3]].color === U_READY && view[4].color === D_STALLED) return sigc(U_READY, S_FRONT, c); 
	}
	if (u_sig === D_MARCH && view[CCW[c][3]].color === U_READY && view[4].color === U_READY)
		return sigc(D_MARCH, S_FRONT, c); 
	if (u_sig === U_READY && view[CCW[c][3]].color === U_REALIGN && view[4].color === U_READY)
		if (view[CCW[c][1]].color === D_MARCH) return sigc(D_MARCH, S_FRONT, c); 

	//Now with those found
	return sigc(view[4].color, S_FRONT, c); 
}

function qdec_three_recover(c)
{
	var u_sig = PUPS[view[c].color][view[CCW[c][1]].color];
	if (u_sig === D_FOOD) return sigc(D_FOOD, S_FRONT, c); 
	
	//With probability, spawn a worker. 
	if (this_ant().food > 0 && [D_STALLED, U_READY].includes(u_sig))
	{
		var food_factor = QFSPAWNP_MAX-QFSPAWNP_MIN
		var food_coefficient = QFSPAWNP_DECAY/food_factor
		var actual_prob = food_factor/(food_coefficient*(this_ant().food-1)+1) + QFSPAWNP_MIN;
		if (rand_choice(actual_prob)) return {cell:CCW[c][3]};
	}

	var provisional = lchk(c)
	if (provisional !== null) return sigc(provisional, S_FRONT, c);
	return sigc(view[4].color, S_FRONT, c);
}

function qdec_three_unstand(c)
{
	var u_sig = PUPS[view[c].color][view[CCW[c][7]].color];

	if (this_ant().food > 0 && u_sig === D_STALLED && view[CCW[c][5]].color === D_MARCH && view[4].color === D_STALLED)
	{
		//Initiate off-phase spawning
		var food_factor = QBSPAWNP_MAX-QBSPAWNP_MIN
		var food_coefficient = QBSPAWNP_DECAY/food_factor
		var actual_prob = food_factor/(food_coefficient*(this_ant().food-1)+1) + QBSPAWNP_MIN;
		if (rand_choice(actual_prob)) return {cell:CCW[c][3]};
	}

	//Reply to stalled with ready
	if (u_sig === D_STALLED && view[CCW[c][5]].color === U_READY && view[4].color === D_STALLED)
		return sigc(U_READY, S_FRONT, c); 

	return sigc(u_sig, S_FRONT, c); 
}

function qdec_three_block(c)
{
	var u_sig = PUPS[view[c].color][view[CCW[c][1]].color];
	return sigc(u_sig, S_FRONT, c); 
}

function qdec_three_side(c)
{
	var u_sig = PUPS[view[CCW[c][1]].color][view[CCW[c][2]].color];
	return sigc(u_sig, S_FRONT, CCW[c][2]); 
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
		case EC_LEFT:
		{
			var u_sig = PUPS[view[c].color][view[CCW[c][1]].color];
			if (u_sig === D_GATHERER) return sigc(D_GATHERER, S_FRONT, c); 
			if (u_sig === U_REALIGN && [U_REALIGN, U_SENTINEL].includes(view[c].color))
				if ([U_REALIGN, U_SENTINEL].includes(view[CCW[c][1]].color))
					return sanitize(early_queen(), LEFT_ORDER);
			var provisional = lchk(c);
			if (provisional !== null) return sigc(provisional, S_FRONT, c); 
			if (this_ant().food > 1) 
			{
				if (view[CCW[c][3]].color !== D_MARCH) return {cell:CCW[c][3], color:D_MARCH};
				return {cell:CCW[c][3], type:GATHERER};
			}
		}
		break;
		case EC_RIGHT:
		{
			var u_sig = PUPS[view[c].color][view[CCW[c][7]].color];
			if (u_sig === D_GATHERER) return sigc(D_GATHERER, S_FRONT, c); 
			if (u_sig === U_REALIGN && [U_REALIGN, U_SENTINEL].includes(view[c].color))
				if ([U_REALIGN, U_SENTINEL].includes(view[CCW[c][7]].color))
					return sanitize(early_queen(), LEFT_ORDER);
			var provisional = lchk(c);
			if (provisional !== null) return sigc(provisional, S_FRONT, c); 
			if (this_ant().food > 1) 
			{
				if (view[CCW[c][5]].color !== D_MARCH) return {cell:CCW[c][5], color:D_MARCH};
				return {cell:CCW[c][5], type:GATHERER};
			}
		}
		break;
	}

	if (view[4].color !== U_PANIC) return sigc(U_PANIC, S_SIDE, c); 
	else return sanitize(opening_queen(), FREE_ORDER);
}

function queen_march()
{
	var c = view_corner();
	switch (neighbor_type(c))
	{
		case EE_STRAIGHT: return qwatch(qdec_ee_straight(c));
		case EE_BENT: return qwatch(qdec_ee_bent(c));
		case EC_SKEWED: return qwatch(qdec_ec_skewed(c));
		case EC_SPAWN: return qwatch(qdec_ec_spawn(c));
		case CC_EDGED: return qwatch(qdec_cc_edged(c));
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
