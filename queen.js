//The queen 

function opening_queen()
{
	for (tcell of rand_perm(SCAN_MOVES))
		if (view[tcell].food === 1) return {cell:tcell};

	var has_ally = false;
	var proxs = [0,0,0,0,0,0,0,0,0];
	for (tcell of SCAN_MOVES)
	{
		if (view[tcell].ant !== null)
		{
			has_ally = true;
			for (var i = 0; i < 9; i++) proxs[i] -= NEARS[tcell][i];
		}
	}
	if (has_ally)
	{
		var prox_order = index_sort(proxs);
		for (var i = 8; i >= 0; i--)
		{
			var i_cell = prox_order[i];
			if (view[i_cell].ant === null && view[i_cell].food === 0) return {cell:i_cell};
		}
	}

	if (this_ant().food > 0) 
	{
		var num_ants = 0;
		for (tcell of SCAN_MOVES)
			if (view[tcell].ant !== null) num_ants++;
		if (num_ants === 0) 
		{
			//Check the area for clearings
			var is_clear = true;
			var num_black_corners = 0;
			for (var tcell = 0; tcell < 9; tcell++)
			{
				if (CORNERS.includes(tcell))
				{
					if (c_at(tcell) === 8) num_black_corners++;
					else if (c_at(tcell) !== 1) is_clear = false;
				}
				else if (c_at(tcell) !== 1) is_clear = false;
			}
			if (num_black_corners === 1 && is_clear) return {cell:0, type:GATHERER};
		}
	}

	if (c_at(4) !== 8) return {cell: 4, color: 8};
	var cands = [0,0,0,0,9,0,0,0,0];
	for (tcell of SCAN_MOVES)
		if (c_at(tcell) === 8)
			for (var i = 0; i < 9; i++) cands[i] -= NEARS[tcell][i];
	var cand_order = index_sort(cands);
	for (var i = 8; i >= 0; i--)
	{
		var i_cell = cand_order[i];
		if (view[i_cell].ant === null && view[i_cell].food === 0) return {cell:i_cell};
	}
	return {cell:4, color:8};
	
}

function early_queen()
{
	//Find the gatherer, revolve counterclockwise around her
	var gcell = null;
	var ally_count = 0;
	for (tcell of rand_perm(SCAN_MOVES))
	{
		if (is_ally(tcell))
		{
			ally_count++;
			if (view[tcell].ant.type === GATHERER && EDGES.includes(tcell)) gcell = tcell;
		}
	}

	if (gcell === null) return opening_queen();


	for (tcell of rand_perm(CORNERS))
		if (view[tcell].food > 0 && NEARS[tcell][gcell] === 5) 
		{
			if (c_at(tcell) === D_FOOD) return {cell:tcell};
			else return {cell:tcell, color:D_FOOD};
		}
	for (tcell of rand_perm(EDGES))
		if (view[tcell].food > 0) 
		{
			if (c_at(tcell) !== D_FOOD && NEARS[tcell][gcell] === 4) 
				return {cell:tcell, color:D_FOOD};
		}

	if (c_at(4) === D_FOOD) 
	{
		if (c_at(CCW[gcell][2]) === D_FOOD && view[CCW[gcell][2]].food === 0)
			return {cell:CCW[gcell][2], color:D_MARCH};
		return {cell:4, color:D_MARCH};
	}

	if (c_at(CCW[gcell][6]) === D_FOOD && view[CCW[gcell][6]].food === 0)
		return {cell:CCW[gcell][6], color:D_MARCH};

	//Once the gatherer is orthogonal to us, spawn a marcher with reasonable probability
	if (EDGES.includes(gcell) && this_ant().food > 2 && ally_count === 1) 
	{
		var num_clear_cells = 0;
		var num_down_food = 0;
		var is_valid = true;
		for (var tcell = 0; tcell < 9; tcell++)
		{
			if (c_at(tcell) === D_FOOD) 
			{
				num_down_food++;
				if (tcell !== 4 && tcell !== gcell) is_valid = false;
			}
			if (c_at(tcell) === D_MARCH) num_clear_cells++;
		}
		if (is_valid && num_down_food === 1 && num_clear_cells === 8)
		{
			var food_factor = QFORMP_MAX-QFORMP_MIN
			var food_coefficient = QFORMP_DECAY/food_factor
			var actual_prob = food_factor/(food_coefficient*(this_ant().food-3)+1) + QFORMP_MIN;

			if (rand_choice(actual_prob)) return {cell:CCW[gcell][1], type:rand_choice(.5)?MARCHER_A:MARCHER_B};
			else return {cell:gcell, color:D_MARCH};
		}
	}

	return {cell:CCW[gcell][7]};
}

//Don't step on food or enemies. Instead, signal. 
function qwatch(cand)
{
	if (cand.hasOwnProperty("type") && this_ant().food === 0) return sigc(U_PANIC, S_SIDE, 0); 
	if (cand.hasOwnProperty("type") && view[cand.cell].food !== 0) return sigc(U_PANIC, S_SIDE, 0);
	if (cand.cell === 4) return cand;
	if (cand.hasOwnProperty("color")) return cand;
	if (is_enemy(cand.cell)) return sigc(U_PANIC, S_SIDE, 0); 
	if (is_ally(cand.cell)) return sigc(c_at(4), S_SIDE, 0); 
	return cand;
}

function eqwatch(cand)
{
	if (cand.hasOwnProperty("type") && this_ant().food === 0) return qwatch(opening_queen());
	if (cand.hasOwnProperty("type") && view[cand.cell].food !== 0) return qwatch(opening_queen());
	if (cand.cell === 4) return cand;
	if (cand.hasOwnProperty("color")) return cand;
	if (is_enemy(cand.cell)) return qwatch(opening_queen());
	if (is_ally(cand.cell)) return qwatch(opening_queen());
	return cand;
}

function qdec_ee_straight(c)
{
	//Don't fight the gatherer
	return sigc(c_at(4), S_SIDE, c); 
}

function qdec_ee_bent(c)
{
	return {cell:CCW[c][2]};
}

function qdec_ec_skewed(c)
{
	if (view[CCW[c][5]].ant.type !== GATHERER) return opening_queen();
	if (this_ant().food > 0 && view[c].ant.type === MARCHER_A) return {cell:CCW[c][7], type:MARCHER_B};
	if (this_ant().food > 0 && view[c].ant.type === MARCHER_B) return {cell:CCW[c][7], type:MARCHER_A};
	return opening_queen();
}

function qdec_ec_spawn(c)
{
	if (view[CCW[c][3]].ant.type !== GATHERER) return opening_queen();
	if (this_ant().food > 0 && view[c].ant.type === MARCHER_A) return {cell:CCW[c][1], type:MARCHER_B};
	if (this_ant().food > 0 && view[c].ant.type === MARCHER_B) return {cell:CCW[c][1], type:MARCHER_A};
	return opening_queen();
}

function qdec_cc_edged(c)
{
	if (view[c].ant.type !== GATHERER) return opening_queen();
	if (this_ant().food > 0 && view[CCW[c][2]].ant.type === MARCHER_A) return {cell:CCW[c][1], type:MARCHER_B};
	if (this_ant().food > 0 && view[CCW[c][2]].ant.type === MARCHER_B) return {cell:CCW[c][1], type:MARCHER_A};
	return opening_queen();
}

function qdec_three_march(c)
{
	var u_sig = PUPS[c_at(c)][c_at(CCW[c][1])];
	if (u_sig === D_STALLED)
	{
		if (c_at(CCW[c][3]) === D_MARCH && [D_MARCH, D_GATHERER].includes(c_at(4))) 
			return sigc(D_STALLED, S_FRONT, c); 
		if (c_at(CCW[c][3]) === U_READY && c_at(4) === D_STALLED) return sigc(U_READY, S_FRONT, c); 
	}
	if (u_sig === D_MARCH && c_at(CCW[c][3]) === U_READY && c_at(4) === U_READY)
		return sigc(D_MARCH, S_FRONT, c); 
	if (u_sig === U_READY && c_at(CCW[c][3]) === U_REALIGN && c_at(4) === U_READY)
		if (c_at(CCW[c][1]) === D_MARCH) return sigc(D_MARCH, S_FRONT, c); 

	//Now with those found
	return sigc(c_at(4), S_FRONT, c); 
}

function qdec_three_stand(c)
{
	var u_sig = PUPS[c_at(c)][c_at(CCW[c][7])];
	if (u_sig === D_STALLED)
	{
		if (c_at(CCW[c][3]) === D_MARCH && c_at(4) === D_GATHERER) return sigc(D_STALLED, S_FRONT, c); 
		if (c_at(CCW[c][3]) === U_READY && c_at(4) === D_STALLED) return sigc(U_READY, S_FRONT, c); 
	}
	if (u_sig === D_MARCH && c_at(CCW[c][3]) === U_READY && c_at(4) === U_READY)
		return sigc(D_MARCH, S_FRONT, c); 
	if (u_sig === U_READY && c_at(CCW[c][3]) === U_REALIGN && c_at(4) === U_READY)
		if (c_at(CCW[c][1]) === D_MARCH) return sigc(D_MARCH, S_FRONT, c); 

	//Now with those found
	return sigc(c_at(4), S_FRONT, c); 
}

function qdec_three_recover(c)
{
	var u_sig = PUPS[c_at(c)][c_at(CCW[c][1])];
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
	return sigc(c_at(4), S_FRONT, c);
}

function qdec_three_unstand(c)
{
	var u_sig = PUPS[c_at(c)][c_at(CCW[c][7])];

	if (this_ant().food > 0 && u_sig === D_STALLED && c_at(CCW[c][5]) === D_MARCH && c_at(4) === D_STALLED)
	{
		//Initiate off-phase spawning
		var food_factor = QBSPAWNP_MAX-QBSPAWNP_MIN
		var food_coefficient = QBSPAWNP_DECAY/food_factor
		var actual_prob = food_factor/(food_coefficient*(this_ant().food-1)+1) + QBSPAWNP_MIN;
		if (rand_choice(actual_prob)) return {cell:CCW[c][3]};
	}

	//Reply to stalled with ready
	if (u_sig === D_STALLED && c_at(CCW[c][5]) === U_READY && c_at(4) === D_STALLED)
		return sigc(U_READY, S_FRONT, c); 

	return sigc(u_sig, S_FRONT, c); 
}

function qdec_three_block(c)
{
	var u_sig = PUPS[c_at(c)][c_at(CCW[c][1])];
	return sigc(u_sig, S_FRONT, c); 
}

function qdec_three_side(c)
{
	var u_sig = PUPS[c_at(CCW[c][1])][c_at(CCW[c][2])];
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
			var u_sig = PUPS[c_at(c)][c_at(CCW[c][1])];
			if (u_sig === D_GATHERER) return sigc(D_GATHERER, S_FRONT, c); 
			if (u_sig === U_REALIGN && [U_REALIGN, U_SENTINEL].includes(c_at(c)))
				if ([U_REALIGN, U_SENTINEL].includes(c_at(CCW[c][1])))
					return eqwatch(early_queen());
			var provisional = lchk(c);
			if (provisional !== null) return sigc(provisional, S_FRONT, c); 
			if (this_ant().food > 1) 
			{
				if (c_at(CCW[c][3]) !== D_MARCH) return {cell:CCW[c][3], color:D_MARCH};
				return {cell:CCW[c][3], type:GATHERER};
			}
		}
		break;
		case EC_RIGHT:
		{
			var u_sig = PUPS[c_at(c)][c_at(CCW[c][7])];
			if (u_sig === D_GATHERER) return sigc(D_GATHERER, S_FRONT, c); 
			if (u_sig === U_REALIGN && [U_REALIGN, U_SENTINEL].includes(c_at(c)))
				if ([U_REALIGN, U_SENTINEL].includes(c_at(CCW[c][7])))
					return eqwatch(early_queen());
			var provisional = lchk(c);
			if (provisional !== null) return sigc(provisional, S_FRONT, c); 
			if (this_ant().food > 1) 
			{
				if (c_at(CCW[c][5]) !== D_MARCH) return {cell:CCW[c][5], color:D_MARCH};
				return {cell:CCW[c][5], type:GATHERER};
			}
		}
		break;
	}

	if (c_at(4) !== U_PANIC) return sigc(U_PANIC, S_SIDE, c); 
	else return opening_queen();
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
		default: return eqwatch(early_queen());
	}
}

function queen_decision()
{
	marcher_count = 0;
	gatherer_count = 0;
	excess_gatherers = 0;
	for (tcell of SCAN_MOVES)
	{
		if (is_ally(tcell))
		{
			if (view[tcell].ant.type === MARCHER_A || view[tcell].ant.type === MARCHER_B) marcher_count++;
			if (view[tcell].ant.type === GATHERER)
			{
				if (EDGES.includes(tcell) || is_gatherer_marcher(tcell)) gatherer_count++;
				else excess_gatherers++;
			}
		}
		else if (is_enemy(tcell)) return opening_queen();
	}
	if (marcher_count > 0 && gatherer_count === 1 && excess_gatherers === 0) return qwatch(queen_march());
	else if (marcher_count > 0 && gatherer_count === 0 && excess_gatherers === 0) return qwatch(queen_wait());
	else if (gatherer_count === 1 && excess_gatherers === 0) return eqwatch(early_queen());
	else return opening_queen();
}
