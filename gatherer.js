//The gatherer

//Don't step on food or enemies. Instead, signal. 
function gwatch(candidate)
{
	if (candidate.cell === 4) return candidate;
	if (candidate.hasOwnProperty("color")) return candidate;
	if (view[candidate.cell].food !== 0 && this_ant().food !== 0) return sigc2(U_PANIC, 0);
	if (view[candidate.cell].ant !== null) return sigc2(U_PANIC, 0); 
	return candidate;
}

function gdec_ee_bent(c)
{
	return {cell:CCW[c][4]};
}

function gdec_ec_left(c)
{
	//Look for signal to walk the line for food
	if (view[c].color === D_FOOD && view[CCW[c][1]].color === D_FOOD) return {cell:CCW[c][7]};
	if (view[c].color === D_STALLED && view[CCW[c][1]].color === D_STALLED) return sigc(U_READY, CCW[c][1]); 
	if (view[c].color === D_MARCH && view[CCW[c][1]].color === D_MARCH) return sigc(D_MARCH, CCW[c][1]);
	return sigc(view[4].color, CCW[c][1]);
	
}

function gdec_ec_right(c)
{
	if ([D_MARCH, D_FOOD].includes(view[c].color) && [D_MARCH, D_FOOD].includes(view[CCW[c][7]].color))
		return {cell:CCW[c][6]};
	if (is_ally(c) && view[c].ant.type === QUEEN)
		return {cell:CCW[c][1]};
	if (view[c].color === D_STALLED && view[CCW[c][7]].color === D_STALLED)
		return sigc(U_READY, CCW[c][1]);
	return sigc(view[4].color, CCW[c][1]);
	
}

function gdec_cc_edged(c)
{
	//Look for queen at CCW[c][2]
	if (view[CCW[c][2]].ant.type !== QUEEN) return sanitize(saboteur(), FREE_ORDER);
	return {cell:CCW[c][1]};
}

function gdec_three_block(c)
{
	if (view[CCW[c][7]].color == D_FOOD) return {cell: CCW[c][6]};
	return {cell:CCW[c][2]};
}

function gdec_three_unstand(c)
{
	//Look for queen at CCW[c][5]
	if (view[CCW[c][5]].ant.type !== QUEEN) return sanitize(saboteur(), FREE_ORDER);
	return {cell:CCW[c][4]};
}

function gdec_four_bent(c)
{
	return {cell:CCW[c][4]};
}

function early_gatherer()
{
	//Revolve clockwise around the queen
	var queen_cell = null;
	var food_count = 0;
	for (try_cell of SCAN_MOVES)
	{
		if (is_ally(try_cell) && view[try_cell].ant.type === QUEEN) queen_cell = try_cell;
		else if (is_enemy(try_cell)) sanitize(saboteur(), FREE_ORDER);
	}
	if (queen_cell === null) return sanitize(saboteur(), FREE_ORDER);
	if (view[queen_cell].color === D_FOOD) return {cell:CCW[queen_cell][7]};

	if (this_ant().food === 0)
	{
		for (try_cell of rand_perm(CORNERS))
			if (view[try_cell].food > 0) 
			{
				if (view[try_cell].color === D_FOOD && NEARS[try_cell].includes(queen_cell)) return {cell:try_cell};
				else if (view[try_cell].color !== D_FOOD) return {cell:try_cell, color:D_FOOD};
			}
		for (try_cell of rand_perm(EDGES))
			if (view[try_cell].food > 0) 
			{
				if (view[try_cell].color !== D_FOOD) return {cell:try_cell, color:D_FOOD};
			}
	}
	return {cell:CCW[queen_cell][1]};
	
}

function gatherer_retrieve()
{
	if (view[4].color === U_PANIC) return sanitize(saboteur(), FREE_ORDER);
	var c = view_corner();
	switch(neighbor_type(c))
	{
		case EC_LEFT: return gwatch({cell:CCW[c][2]});
		case THREE_BLOCK: 
		{
			//Walk forward only if given the D_FOOD signal
			if (view[CCW[c][7]].color === D_FOOD) return gwatch({cell:CCW[c][6]});
			return gwatch({cell:CCW[c][2]});
		}
		case FOUR_BENT: return gwatch(sigc(view[4].color, c));
		default: return sanitize(early_gatherer(), FREE_ORDER);
	}
}

function gatherer_return()
{
	if (view[4].color === U_PANIC) return sanitize(saboteur(), FREE_ORDER);
	var c = view_corner();
	switch(neighbor_type(c))
	{
		case EC_LEFT: return gwatch({cell:CCW[c][2]});
		case THREE_BLOCK: return gwatch({cell:CCW[c][2]});
		case FOUR_BENT: return gwatch({cell:CCW[c][4]});
		default: return sanitize(early_gatherer(), FREE_ORDER);
	}
}


function gatherer_formation()
{
	if (view[4].color === U_PANIC) return sanitize(saboteur(), FREE_ORDER);
	var c = view_corner();
	switch (neighbor_type(c))
	{
		case EC_LEFT: return gwatch(gdec_ec_left(c));
		case EC_RIGHT: return gwatch(gdec_ec_right(c));
		case CC_EDGED: return gwatch(gdec_cc_edged(c));
		case EE_BENT: return gwatch(gdec_ee_bent(c));
		case THREE_BLOCK: return gwatch(gdec_three_block(c));
		case THREE_UNSTAND: return gwatch(gdec_three_unstand(c));
		case FOUR_BENT: return gwatch(gdec_four_bent(c));
		default: return sanitize(early_gatherer(), LEFT_ORDER);
	}
}

function gatherer_decision()
{
	var marcher_count = 0;
	var gatherer_count = 0;
	var queen_pos = null;
	for (try_cell of SCAN_MOVES)
		if (is_ally(try_cell))
		{
			if (view[try_cell].ant.type === MARCHER_A || view[try_cell].ant.type === MARCHER_B) marcher_count++;
			if (view[try_cell].ant.type === GATHERER) gatherer_count++;
			if (view[try_cell].ant.type === QUEEN) queen_pos = try_cell;
		}
	if (gatherer_count > 0) return sanitize(saboteur(), FREE_ORDER);
	if (this_ant().food > 0 && marcher_count > 0) return gwatch(gatherer_return());
	else if (queen_pos !== null && marcher_count > 0) return gwatch(gatherer_formation());
	else if (marcher_count > 0) return gwatch(gatherer_retrieve());
	else if (queen_pos !== null) return sanitize(early_gatherer(), LEFT_ORDER);
	else return sanitize(saboteur(), FREE_ORDER);
}
