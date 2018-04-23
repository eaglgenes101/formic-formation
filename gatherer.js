//The gatherer

//Don't step on food or enemies. Instead, signal. 
function gwatch(cand)
{
	if (cand.cell === 4) return cand;
	if (cand.hasOwnProperty("color")) return cand;
	if (view[cand.cell].food !== 0 && this_ant().food !== 0) return sigc(U_PANIC, S_SIDE, 0);
	if (view[cand.cell].ant !== null) return sigc(U_PANIC, S_SIDE, 0); 
	return cand;
}

function egwatch(cand)
{
	if (cand.cell === 4) return cand;
	if (cand.hasOwnProperty("color")) return cand;
	if (view[cand.cell].food !== 0 && this_ant().food !== 0) return gwatch(sdec_erase());
	if (view[cand.cell].ant !== null) return gwatch(sdec_erase()); 
	return cand;
}

function gdec_ee_bent(c)
{
	return {cell:CCW[c][4]};
}

function gdec_ec_left(c)
{
	//Look for signal to walk the line for food
	if (c_at(c) === D_FOOD && c_at(CCW[c][1]) === D_FOOD) return {cell:CCW[c][7]};
	if (c_at(c) === D_STALLED && c_at(CCW[c][1]) === D_STALLED) return sigc(U_READY, S_GATHERER, c); 
	if (c_at(c) === D_MARCH && c_at(CCW[c][1]) === D_MARCH) return sigc(D_MARCH, S_GATHERER, c);
	return sigc(c_at(4), S_GATHERER, c);
	
}

function gdec_ec_right(c)
{
	if ([D_MARCH, D_FOOD].includes(c_at(c)) && [D_MARCH, D_FOOD].includes(c_at(CCW[c][7])))
		return {cell:CCW[c][6]};
	if (is_ally(c) && view[c].ant.type === QUEEN)
		return {cell:CCW[c][1]};
	if (c_at(c) === D_STALLED && c_at(CCW[c][7]) === D_STALLED)
		return sigc(U_READY, S_GATHERER, c);
	return sigc(c_at(4), S_GATHERER, c);
	
}

function gdec_cc_edged(c)
{
	//Look for queen at CCW[c][2]
	if (view[CCW[c][2]].ant.type !== QUEEN) return sanitize(saboteur());
	return {cell:CCW[c][1]};
}

function gdec_three_block(c)
{
	if (c_at(CCW[c][7]) == D_FOOD) return {cell: CCW[c][6]};
	return {cell:CCW[c][2]};
}

function gdec_three_unstand(c)
{
	//Look for queen at CCW[c][5]
	if (view[CCW[c][5]].ant.type !== QUEEN) return sanitize(saboteur());
	return {cell:CCW[c][4]};
}

function gdec_four_bent(c)
{
	return {cell:CCW[c][4]};
}

function early_gatherer()
{
	//Revolve clockwise around the queen
	var qcell = null;
	var food_count = 0;
	for (tcell of SCAN_MOVES)
	{
		if (is_ally(tcell) && view[tcell].ant.type === QUEEN) qcell = tcell;
		else if (is_enemy(tcell)) sanitize(saboteur());
	}
	if (qcell === null) return sanitize(saboteur());
	if (c_at(qcell) === D_FOOD) return {cell:CCW[qcell][7]};

	if (this_ant().food === 0)
	{
		for (tcell of rand_perm(CORNERS))
			if (view[tcell].food > 0) 
			{
				if (c_at(tcell) === D_FOOD && NEARS[tcell][qcell] === 5) return {cell:tcell};
				else if (c_at(tcell) !== D_FOOD) return {cell:tcell, color:D_FOOD};
			}
		for (tcell of rand_perm(EDGES))
			if (view[tcell].food > 0) 
			{
				if (c_at(tcell) !== D_FOOD && NEARS[tcell][qcell] === 5) 
					return {cell:tcell, color:D_FOOD};
			}
	}
	return {cell:CCW[qcell][1]};
	
}

function gatherer_retrieve()
{
	if (c_at(4) === U_PANIC) return sanitize(saboteur());
	var c = view_corner();
	switch(neighbor_type(c))
	{
		case EC_LEFT: return gwatch({cell:CCW[c][2]});
		case THREE_BLOCK: 
		{
			//Walk forward only if given the D_FOOD signal
			if (c_at(CCW[c][7]) === D_FOOD) return gwatch({cell:CCW[c][6]});
			return gwatch({cell:CCW[c][2]});
		}
		case FOUR_BENT: return gwatch(sigc(c_at(4), S_FRONT, c));
		default: return sanitize(early_gatherer());
	}
}

function gatherer_return()
{
	if (c_at(4) === U_PANIC) return sanitize(saboteur());
	var c = view_corner();
	switch(neighbor_type(c))
	{
		case EC_LEFT: return gwatch({cell:CCW[c][2]});
		case THREE_BLOCK: return gwatch({cell:CCW[c][2]});
		case FOUR_BENT: return gwatch({cell:CCW[c][4]});
		default: return sanitize(early_gatherer());
	}
}


function gatherer_formation()
{
	if (c_at(4) === U_PANIC) return sanitize(saboteur());
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
		default: return egwatch(early_gatherer());
	}
}

function gatherer_decision()
{
	var marcher_count = 0;
	var gatherer_count = 0;
	var queen_pos = null;
	for (tcell of SCAN_MOVES)
		if (is_ally(tcell))
		{
			if (view[tcell].ant.type === MARCHER_A || view[tcell].ant.type === MARCHER_B) marcher_count++;
			if (view[tcell].ant.type === GATHERER) gatherer_count++;
			if (view[tcell].ant.type === QUEEN) queen_pos = tcell;
		}
	if (gatherer_count > 0) return sanitize(saboteur());
	if (this_ant().food > 0 && marcher_count > 0) return gwatch(gatherer_return());
	else if (queen_pos !== null && marcher_count > 0) return gwatch(gatherer_formation());
	else if (marcher_count > 0) return gwatch(gatherer_retrieve());
	else if (queen_pos !== null) return egwatch(early_gatherer());
	else return sanitize(saboteur());
}
