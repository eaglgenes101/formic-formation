//Marchers A and B

function mdec_one_corner(c)
{
	if (view[c].ant.type === QUEEN)
		return sigc(c_at(4), S_SIDE, c);
	else return saboteur();
}

function mdec_one_edge(c)
{
	//This occurs when we march forward as the end, but the next c neighbor is obstructed
	//Find this condition
	if ([U_REALIGN, D_MARCH].includes(c_at(CCW[c][1])))
	{
		if (view[CCW[c][2]].food === 1) return {cell:c};
		if (is_ally(CCW[c][2]) && view[CCW[c][2]].ant.type === GATHERER) return {cell:c};
	}
	//Break away
	return saboteur();
}

function mdec_ee_bent(c)
{
	//Eject in scenarios where we would otherwise deadlock
	if (view[CCW[c][1]].ant.type === GATHERER && view[CCW[c][3]].ant.type === QUEEN) return saboteur();
	if (view[CCW[c][1]].ant.type === QUEEN && view[CCW[c][3]].ant.type === GATHERER) return saboteur();

	var u_sig = c_at(CCW[c][1]);
	var d_sig = c_at(CCW[c][3]);

	//Keep still to assist spawning
	if (is_ally(c) && view[c].ant.type === GATHERER) return sigc(c_at(4), S_SIDE, CCW[c][4]);

	var provisional = lchk(c);
	if (provisional !== null) 
	{
		if (provisional === U_REALIGN) return sigc(U_SENTINEL, S_END, c); 
		return sigc(provisional, S_END, c); 
	}
	
	//In recovery, do the moving step
	if (u_sig === D_STALLED)
	{
		if ([D_STALLED, U_READY, D_GATHERER].includes(d_sig) && [D_STALLED, U_READY].includes(c_at(4)))
			return sigc(D_STALLED, S_SIDE, c); 
		if (d_sig === U_REALIGN && c_at(4) === D_STALLED)
			return sigc(D_STALLED, S_SIDE, c); 
	}

	//Special case: when the queen is visible at CCW[c][1], we may need to do signal transmission
	if (view[CCW[c][1]].ant.type === QUEEN)
	{
		var provisional = lchk(CCW[c][4]);
		if (provisional !== null) return sigc(provisional, S_END, CCW[c][4]); 
		if (u_sig === D_GATHERER && d_sig === U_REALIGN && c_at(4) === D_GATHERER)
			return sigc(D_GATHERER, S_END, CCW[c][4]); 
	}

	if (u_sig === U_SENTINEL)
	{
		if (d_sig === U_REALIGN && [D_MARCH, U_SENTINEL].includes(c_at(4))) return sigc(U_SENTINEL, S_SIDE, c); 
		if (d_sig === D_STALLED && [U_SENTINEL, D_STALLED].includes(c_at(4))) return sigc(U_SENTINEL, S_SIDE, c); 
		if (d_sig === D_MARCH && [U_SENTINEL, D_MARCH].includes(c_at(4))) return sigc(D_MARCH, S_SIDE, c); 
	}

	if (u_sig === D_GATHERER && d_sig === D_STALLED && c_at(4) === D_GATHERER) return sigc(D_STALLED, S_SIDE, c); 
	
	return {cell:CCW[c][2]}; 
}

function mdec_ee_straight(c)
{
	return sigc(U_REALIGN, S_SIDE, c); 
}

function mdec_ec_left(c)
{
	//Eject in scenarios where we would otherwise deadlock
	if (view[CCW[c][1]].ant.type === GATHERER && view[c].ant.type === QUEEN) return saboteur();
	if (view[CCW[c][1]].ant.type === QUEEN && view[c].ant.type === GATHERER) return saboteur();

	if (is_other(CCW[c][1]) && view[c].ant.type === QUEEN) return {cell:CCW[c][3]};

	var d_sig = PDOWNS[c_at(c)][c_at(CCW[c][1])];

	//Special logic for spawning workers correctly
	if (is_ally(CCW[c][4]) && view[CCW[c][4]].ant.type === GATHERER && d_sig === D_STALLED && c_at(4) === D_STALLED)
		return sigc(D_STALLED, S_END, c);

	var provisional = lchk(CCW[c][4]);
	if (provisional !== null) 
	{
		if (provisional === U_REALIGN) return sigc(U_SENTINEL, S_END, CCW[c][4]); 
		return sigc(provisional, S_END, CCW[c][4]); 
	}
	if (d_sig === U_REALIGN)
	{
		if (c_at(4) === D_MARCH) return sigc(U_SENTINEL, S_END, CCW[c][4]); 
		if (c_at(4) === U_SENTINEL)
		{
			if (c_at(c) === D_MARCH) return {cell:CCW[c][2]};
			return sigc(U_SENTINEL, S_END, CCW[c][4]); 
		}
	}
	if (d_sig === D_STALLED)
	{
		if ([D_MARCH, D_STALLED].includes(c_at(4))) return sigc(D_STALLED, S_END, CCW[c][4]); 
		if (c_at(4) === U_SENTINEL) return sigc(U_SENTINEL, S_END, CCW[c][4]); 
	}
	if (d_sig === D_GATHERER)
	{
		if (c_at(4) === D_FOOD) return sigc(D_GATHERER, S_END, CCW[c][4]);
		if (c_at(4) === D_GATHERER) return sigc(D_STALLED, S_END, CCW[c][4]); 
	}
	if (d_sig === U_READY)
	{
		if (c_at(4) === D_STALLED)
		{
			if (c_at(CCW[c][2]) !== D_MARCH) return {cell:CCW[c][2], color:D_MARCH};
			return sigc(D_MARCH, S_END, CCW[c][4]); 
		}
		if (c_at(4) === U_SENTINEL) return sigc(D_MARCH, S_END, CCW[c][4]); 
	}

	//If none of the signals fit, go by the march
	return {cell:CCW[c][2]};
	
}

function mdec_ec_right(c)
{
	//Special logic do early-game correctly
	if (view[c].ant.type === GATHERER && view[CCW[c][7]].ant.type === QUEEN)
		if (is_ally(CCW[c][4]) && view[CCW[c][4]].ant.type !== this_ant().type) return {cell:CCW[c][5]};

	var d_sig = PDOWNS[c_at(c)][c_at(CCW[c][7])];
	
	var provisional = lchk(CCW[c][4]);
	if (provisional !== null) 
	{
		if (provisional === U_REALIGN) return sigc(U_SENTINEL, S_END, CCW[c][4]); 
		return sigc(provisional, S_END, CCW[c][4]); 
	}
	if (d_sig === D_MARCH)
	{
		if (c_at(4) === D_MARCH) return sigc(D_MARCH, S_END, CCW[c][4]); 
		if ([D_FOOD, D_GATHERER, U_READY].includes(c_at(4))) return sigc(D_MARCH, S_END, CCW[c][4]); 
	}
	if (d_sig === D_FOOD)
	{
		if ([U_SENTINEL, D_STALLED].includes(c_at(4))) return sigc(D_STALLED, S_END, CCW[c][4]); 
		if ([D_FOOD, D_GATHERER, U_READY].includes(c_at(4))) return sigc(D_STALLED, S_END, CCW[c][4]);
	}
	if (d_sig === D_GATHERER)
	{
		if ([D_FOOD, D_GATHERER, U_READY].includes(c_at(4))) return sigc(D_MARCH, S_END, CCW[c][4]);
		if ([U_SENTINEL, D_STALLED].includes(c_at(4))) return sigc(D_STALLED, S_END, CCW[c][4]); 
	}
	if (d_sig === D_STALLED)
	{
		if (c_at(4) === D_STALLED) return sigc(D_STALLED, S_END, CCW[c][4]); 
		if ([D_FOOD, D_GATHERER, U_READY].includes(c_at(4))) return sigc(D_STALLED, S_END, CCW[c][4]);
	}
	if (d_sig === U_READY)
	{
		if (c_at(4) === D_STALLED) return sigc(D_MARCH, S_END, CCW[c][4]); 
		if ([D_FOOD, D_GATHERER, U_READY].includes(c_at(4))) return sigc(D_MARCH, S_END, CCW[c][4]);
	}
	if (d_sig === U_REALIGN)
	{
		if (c_at(4) === U_SENTINEL) return {cell:CCW[c][6]};
		if ([D_FOOD, D_GATHERER, U_READY].includes(c_at(4))) return sigc(D_STALLED, S_END, CCW[c][4]);
	}

	return sigc(d_sig, S_END, CCW[c][4]); 
	
}

function mdec_ec_spawn(c)
{
	if (view[c].ant.type === QUEEN && c_at(c) === D_MARCH && c_at(CCW[c][3]) === D_STALLED)
		if (c_at(4) === D_STALLED) return sigc(D_STALLED, S_SIDE, c); 
	return saboteur();
}

function mdec_three_march(c)
{
	var d_sig = PDOWNS[c_at(c)][c_at(CCW[c][1])];
	var u_sig = c_at(CCW[c][3]);
	
	var provisional = lchk2(c);
	if (provisional !== null) return sigc(provisional, S_FRONT, c); 
	
	if (u_sig === U_SENTINEL)
	{
		if (d_sig === D_GATHERER && [D_GATHERER, D_STALLED].includes(c_at(4))) return sigc(D_STALLED, S_FRONT, c); 
		if (d_sig === D_STALLED && [D_MARCH, D_STALLED].includes(c_at(4))) return sigc(D_STALLED, S_FRONT, c); 
	}
	if (u_sig === U_REALIGN)
	{
		if (d_sig === U_REALIGN && c_at(4) === U_REALIGN)
			if (c_at(c) === U_SENTINEL)
			{
				if (c_at(CCW[c][7]) === D_MARCH) return sigc(U_REALIGN, S_FRONT, c); 
				return {cell:CCW[c][2]};
			}

		if (d_sig === D_FOOD && [D_MARCH, D_FOOD].includes(c_at(4))) return sigc(D_FOOD, S_FRONT, c);
		if (d_sig === U_READY && c_at(4) === D_STALLED) return sigc(D_MARCH, S_FRONT, c); 
		if (d_sig === D_STALLED && [D_MARCH, D_STALLED].includes(c_at(4))) return sigc(D_STALLED, S_FRONT, c);
		if (d_sig === D_GATHERER && [D_GATHERER, D_STALLED].includes(c_at(4))) return sigc(D_STALLED, S_FRONT, c); 
		if (d_sig === D_MARCH && c_at(4) === D_STALLED) return sigc(D_STALLED, S_FRONT, c);
	}
	if (u_sig === D_MARCH)
	{
		if (d_sig === D_FOOD && c_at(4) === D_FOOD) return sigc(D_FOOD, S_FRONT, c);
		if (d_sig === U_REALIGN && c_at(4) === D_MARCH)
			if (c_at(c) === U_SENTINEL) return sigc(U_REALIGN, S_FRONT, c); 
		if (d_sig === U_READY && c_at(4) === U_READY) return sigc(D_MARCH, S_FRONT, c); 
	}
	if (u_sig === D_STALLED)
	{
		if (d_sig === U_READY && c_at(4) === D_STALLED) return sigc(U_READY, S_FRONT, c); 
		if (d_sig === D_STALLED && [D_STALLED, D_MARCH].includes(c_at(4))) return sigc(D_STALLED, S_FRONT, c); 
		if (d_sig === D_GATHERER && c_at(4) === D_GATHERER) return sigc(D_STALLED, S_FRONT, c); 
		if (d_sig === D_MARCH && c_at(4) === D_STALLED) return sigc(D_STALLED, S_FRONT, c); 
		if (d_sig === U_REALIGN && [D_STALLED, D_MARCH].includes(c_at(4))) return sigc(D_STALLED, S_FRONT, c); 
	}
	if (u_sig === D_GATHERER)
	{
		if (d_sig === D_STALLED && c_at(4) === D_GATHERER)
			if (view[CCW[c][3]].ant.type === QUEEN) return sigc(D_STALLED, S_FRONT, c); 
		if (d_sig === D_GATHERER && c_at(4) === D_GATHERER) return sigc(D_GATHERER, S_FRONT, c); 
		if (d_sig === D_FOOD && c_at(4) === D_GATHERER) return sigc(D_FOOD, S_FRONT, c); 
	}
	if (u_sig === D_FOOD)
	{
		if (d_sig === D_FOOD && c_at(4) === D_FOOD) return sigc(D_FOOD, S_FRONT, c); 
		if (d_sig === D_GATHERER && c_at(4) === D_GATHERER) return sigc(D_GATHERER, S_FRONT, c); 
	}

	return {cell:CCW[c][2]};
	
}

function mdec_three_stand(c)
{
	var provisional = lchk2(c);
	if (provisional !== null) return sigc(provisional, S_SIDE, c); 
	
	var u_sig = c_at(CCW[c][3]);
	var d_sig = PSIDES[c_at(c)][c_at(CCW[c][7])];

	if (u_sig === U_REALIGN)
	{
		if ([D_MARCH, D_STALLED].includes(d_sig) && c_at(4) === D_MARCH) return sigc(U_REALIGN, S_SIDE, CCW[c][4]); 
		if (c_at(4) === U_REALIGN) return sigc(U_REALIGN, S_SIDE, CCW[c][4]);
	}
	if (u_sig === D_MARCH && d_sig === U_REALIGN && c_at(4) === D_MARCH) return sigc(U_REALIGN, S_SIDE, CCW[c][4]); 
	if (u_sig === D_STALLED && [D_STALLED, U_REALIGN].includes(d_sig) && c_at(4) === D_STALLED) 
		return sigc(D_STALLED, S_SIDE, CCW[c][4]); 
	
	return sigc(D_MARCH, S_SIDE, CCW[c][4]); 
	
}

function mdec_three_unstand(c)
{
	if (view[CCW[c][5]].ant.type === QUEEN)
	{
		var provisional = lchk(c);
		if (provisional !== null) return sigc(provisional, S_FRONT, c); 
		var d_sig = PUPS[c_at(c)][c_at(CCW[c][7])];
		return sigc(d_sig, S_FRONT, c); 
	}
	else
	{
		var provisional = lchk(CCW[c][4]);
		if (provisional !== null) return sigc(provisional, S_FRONT, CCW[c][4]); 

		var u_sig = c_at(CCW[c][5]);
		var d_sig = PDOWNS[c_at(c)][c_at(CCW[c][7])];

		if (u_sig === D_MARCH)
		{
			if (d_sig === U_READY && c_at(4) === U_READY) return sigc(D_MARCH, S_FRONT, CCW[c][4]); 
			if (d_sig === D_FOOD && c_at(4) === D_MARCH) return sigc(U_REALIGN, S_FRONT, CCW[c][4]); 
			if ([D_FOOD, D_GATHERER].includes(c_at(4))) return sigc(D_MARCH, S_FRONT, CCW[c][4]);
		}
		if (u_sig === D_FOOD)
		{
			if (d_sig === D_FOOD && c_at(4) === D_MARCH) return sigc(U_REALIGN, S_FRONT, CCW[c][4]); 
			if ([D_FOOD, D_GATHERER].includes(c_at(4))) return sigc(D_STALLED, S_FRONT, CCW[c][4]);
		}
		if (u_sig === D_GATHERER)
		{
			if (d_sig === D_FOOD && c_at(4) === D_MARCH) return sigc(U_REALIGN, S_FRONT, CCW[c][4]); 
			if ([D_FOOD, D_GATHERER].includes(c_at(4))) return sigc(D_STALLED, S_FRONT, CCW[c][4]);
		}
		if (u_sig === D_STALLED)
		{
			if (d_sig === U_READY)
			{
				if (c_at(4) === D_STALLED) return sigc(U_READY, S_FRONT, CCW[c][4]); 
				if (c_at(4) === D_GATHERER) return sigc(D_STALLED, S_FRONT, CCW[c][4]);
			}
			if (d_sig === D_FOOD)
			{
				if (c_at(4) === D_MARCH) return sigc(U_REALIGN, S_FRONT, CCW[c][4]); 
				if (c_at(4) === D_GATHERER) return sigc(D_STALLED, S_FRONT, CCW[c][4]);
			}
			if (d_sig === D_STALLED)
			{
				if (c_at(4) === D_STALLED) return sigc(D_STALLED, S_FRONT, CCW[c][4]);
				if (c_at(4) === D_GATHERER) return sigc(D_STALLED, S_FRONT, CCW[c][4]);
			}
			if (d_sig === D_GATHERER && c_at(4) === D_GATHERER) return sigc(D_STALLED, S_FRONT, CCW[c][4]); 
			if ([D_MARCH, U_REALIGN].includes(d_sig) && c_at(4) === D_GATHERER) 
				return sigc(D_STALLED, S_FRONT, CCW[c][4]);
			if (c_at(4) === D_FOOD) return sigc(D_STALLED, S_FRONT, CCW[c][4]);
		}
		if (u_sig === U_REALIGN)
		{
			if (d_sig === D_FOOD && c_at(4) === D_MARCH) return sigc(U_REALIGN, S_FRONT, CCW[c][4]); 
			if ([D_FOOD, D_GATHERER].includes(c_at(4))) return sigc(D_STALLED, S_FRONT, CCW[c][4]);
		}
		if (u_sig === U_SENTINEL)
		{
			if (d_sig === D_FOOD)
			{
				if (c_at(4) === U_REALIGN) return sigc(D_STALLED, S_FRONT, CCW[c][4]);
				if (c_at(4) === D_MARCH) return sigc(U_REALIGN, S_FRONT, CCW[c][4]);
			}
			if (d_sig === D_GATHERER && c_at(4) === U_REALIGN) return sigc(D_STALLED, S_FRONT, CCW[c][4]);
			if (d_sig === D_MARCH && c_at(4) === U_SENTINEL) return sigc(D_MARCH, S_FRONT, CCW[c][4]); 
			if (d_sig === D_STALLED && c_at(4) === U_SENTINEL) return sigc(D_STALLED, S_FRONT, CCW[c][4]); 
			if (d_sig === U_READY && c_at(4) === D_STALLED) return sigc(U_READY, S_FRONT, CCW[c][4]); 
			if ([D_FOOD, D_GATHERER].includes(c_at(4))) return sigc(D_STALLED, S_FRONT, CCW[c][4]);
		}
		if (u_sig === U_READY)
		{
			if (d_sig === D_FOOD && c_at(4) === D_MARCH) return sigc(U_REALIGN, S_FRONT, CCW[c][4]); 
			if ([D_FOOD, D_GATHERER].includes(c_at(4))) return sigc(D_MARCH, S_FRONT, CCW[c][4]);
		}
		return sigc(c_at(4), S_FRONT, CCW[c][4]); 
	}
}

function mdec_three_recover(c)
{
	//This should only happen in the middle of recovery
	return sigc(U_SENTINEL, S_FRONT, c); 
}

function mdec_three_hang(c)
{
	return sigc(c_at(4), S_SIDE, CCW[c][4]); 
}

function mdec_three_unhang(c)
{
	return sigc(c_at(4), S_SIDE, c); 
}

function mdec_four_z(c)
{
	var provisional = lchk2(CCW[c][4]);
	if (provisional !== null) return sigc(provisional, S_SIDE, CCW[c][4]); 

	var u_sig = PSIDES[c_at(c)][c_at(CCW[c][7])];
	var d_sig = PSIDES[c_at(CCW[c][4])][c_at(CCW[c][3])];

	if (u_sig === D_FOOD)
	{
		if ([D_FOOD, D_STALLED, U_REALIGN].includes(d_sig) && c_at(4) === U_REALIGN) 
			return sigc(U_REALIGN, S_SIDE, CCW[c][4]);
		if (d_sig === D_GATHERER && [U_REALIGN, D_GATHERER].includes(c_at(4))) 
			return sigc(U_REALIGN, S_SIDE, CCW[c][4]);
	}
	if (u_sig === D_STALLED)
	{
		if (d_sig === U_REALIGN) return sigc(U_REALIGN, S_SIDE, CCW[c][4]); 
		if (d_sig === D_FOOD && c_at(4) === U_REALIGN) return sigc(U_REALIGN, S_SIDE, CCW[c][4]);
	}
	if (u_sig === D_GATHERER)
	{
		if (d_sig === U_REALIGN && c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, CCW[c][4]); 
		if (d_sig === D_FOOD && [U_REALIGN, D_GATHERER].includes(c_at(4))) 
			return sigc(U_REALIGN, S_SIDE, CCW[c][4]);
	}
	if (u_sig === U_REALIGN)
	{
		if (d_sig === D_FOOD && c_at(4) === U_REALIGN) return sigc(U_REALIGN, S_SIDE, CCW[c][4]); 
		if (d_sig === D_STALLED) return sigc(U_REALIGN, S_SIDE, CCW[c][4]); 
		if (d_sig === D_GATHERER && c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, CCW[c][4]); 
		if (d_sig === U_READY && c_at(4) === U_REALIGN) return sigc(D_MARCH, S_SIDE, CCW[c][4]); 
	}
	if (u_sig === U_READY && d_sig === U_REALIGN && c_at(4) === U_REALIGN)
		return sigc(D_MARCH, S_SIDE, CCW[c][4]); 

	return sigc(D_MARCH, S_SIDE, CCW[c][4]); 
}

function mdec_four_stairs(c)
{
	var provisional = lchk2(c);
	if (provisional !== null) return sigc(provisional, S_SIDE, c);

	var u_sig = PSIDES[c_at(c)][c_at(CCW[c][1])];
	var d_sig = PSIDES[c_at(CCW[c][4])][c_at(CCW[c][3])];

	if (u_sig === D_MARCH)
	{
		if (d_sig === D_FOOD)
		{
			if (c_at(4) === D_MARCH) return sigc(D_FOOD, S_SIDE, c);
			if (c_at(4) === U_REALIGN) return sigc(D_MARCH, S_SIDE, c);
		}
		if (d_sig === U_READY)
		{
			if (c_at(4) === U_READY) return sigc(D_MARCH, S_SIDE, c);
			if (c_at(4) === U_REALIGN) return sigc(D_MARCH, S_SIDE, c);
		}
		if (d_sig === D_STALLED)
		{
			if (c_at(4) === D_MARCH) return sigc(D_STALLED, S_SIDE, c);
			if (c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
		}
		if (d_sig === D_GATHERER && c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
		if ([D_MARCH, U_REALIGN].includes(d_sig) && c_at(4) === U_REALIGN) return sigc(D_MARCH, S_SIDE, c);
	}

	if (u_sig === D_FOOD)
	{
		if (d_sig === D_MARCH)
		{
			if (c_at(4) === U_REALIGN) return sigc(D_MARCH, S_SIDE, c);
			if (c_at(4) === D_MARCH) return sigc(D_FOOD, S_SIDE, c);
		}
		if (d_sig === U_READY)
		{
			if (c_at(4) === U_REALIGN) return sigc(D_MARCH, S_SIDE, c);
			if (c_at(4) === D_STALLED) return sigc(D_STALLED, S_SIDE, c);
		}
		if (d_sig === D_GATHERER && [U_REALIGN, D_GATHERER].includes(c_at(4))) return sigc(D_FOOD, S_SIDE, c);
		if ([U_REALIGN, D_STALLED].includes(d_sig) && c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
	}

	if (u_sig === D_STALLED)
	{
		if (d_sig === D_STALLED)
		{
			if (c_at(4) === D_STALLED) return sigc(D_STALLED, S_SIDE, c);
			if (c_at(4) === D_MARCH) return sigc(D_STALLED, S_SIDE, c);
			if (c_at(4) === U_REALIGN) return sigc(D_MARCH, S_SIDE, c);
		}
		if (d_sig === D_MARCH)
		{
			if (c_at(4) === D_MARCH) return sigc(D_STALLED, S_SIDE, c);
			if (c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
		}
		if (d_sig === D_GATHERER)
		{
			if (c_at(4) === U_REALIGN) return sigc(D_MARCH, S_SIDE, c);
			if ([D_STALLED, D_GATHERER].includes(c_at(4))) return sigc(D_STALLED, S_SIDE, c);
		}
		if (d_sig === U_READY)
		{
			if (c_at(4) === D_STALLED) return sigc(U_READY, S_SIDE, c);
			if (c_at(4) === U_REALIGN) return sigc(D_MARCH, S_SIDE, c);
		}
		if (d_sig === U_REALIGN && [U_REALIGN, D_MARCH].includes(c_at(4))) return sigc(D_STALLED, S_SIDE, c);
		if (d_sig === D_FOOD && c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
	}

	if (u_sig === D_GATHERER)
	{
		if (d_sig === D_STALLED)
		{
			if ([D_STALLED, D_GATHERER].includes(c_at(4))) return sigc(D_STALLED, S_SIDE, c);
			if (c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
		}
		if (d_sig === U_READY)
		{
			if (c_at(4) === D_STALLED) return sigc(D_STALLED, S_SIDE, c);
			if (c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
		}
		if (d_sig === D_FOOD && [D_GATHERER, U_REALIGN].includes(c_at(4))) return sigc(D_FOOD, S_SIDE, c);
		if ([D_MARCH, U_REALIGN].includes(d_sig) && c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
		if (d_sig === D_GATHERER && c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
	}

	if (u_sig === U_REALIGN)
	{
		if (d_sig === U_REALIGN)
		{
			if (c_at(4) === D_MARCH) return sigc(D_STALLED, S_SIDE, c);
			if (c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
		}
		if (d_sig === D_STALLED)
		{
			if (c_at(4) === D_MARCH) return sigc(D_STALLED, S_SIDE, c);
			if (c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
		}
		if (d_sig === D_MARCH && c_at(4) === U_REALIGN) return sigc(D_MARCH, S_SIDE, c);
		if ([D_FOOD, D_GATHERER, U_READY].includes(d_sig) && c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
	}

	if (u_sig === U_READY)
	{
		if (d_sig === D_MARCH)
		{
			if (c_at(4) === U_READY) return sigc(D_MARCH, S_SIDE, c);
			if (c_at(4) === U_REALIGN) return sigc(U_READY, S_SIDE, c);
		}
		if ([D_FOOD, D_GATHERER].includes(d_sig))
		{
			if (c_at(4) === D_STALLED) return sigc(D_STALLED, S_SIDE, c);
			if (c_at(4) === U_REALIGN) return sigc(U_READY, S_SIDE, c);
		}
		if (d_sig === D_STALLED && c_at(4) === D_STALLED) return sigc(U_READY, S_SIDE, c);
		if (d_sig === U_REALIGN && c_at(4) === U_REALIGN) return sigc(D_STALLED, S_SIDE, c);
		if (d_sig === U_READY && c_at(4) === U_REALIGN) return sigc(U_READY, S_SIDE, c);
	}

	return sigc(c_at(4), S_SIDE, c);
	
}

//Don't step on food or enemies. Instead, signal. 
function mwatch(cand)
{
	if (cand.cell === 4) return cand;
	if (cand.hasOwnProperty("color")) return cand;
	if (view[cand.cell].food !== 0) return sigc(D_FOOD, S_SIDE, 0);
	if (is_harvestable(cand.cell)) return sigc(D_FOOD, S_SIDE, 0);
	if (view[cand.cell].ant !== null) return sigc(U_PANIC, S_SIDE, 0);
	return cand;
}

function marcher_decision()
{
	var gatherer_count = 0;
	var enemy_count = 0;
	for (tcell of SCAN_MOVES)
	{
		if (is_ally(tcell) && view[tcell].ant.type === GATHERER) gatherer_count++;
		else if (is_enemy(tcell) && !is_harvestable(tcell))enemy_count++;
	}
	if (gatherer_count > 1 || enemy_count > 0) return saboteur();
	var c = view_corner();
	if (c_at(4) === U_PANIC || this_ant().food > 0) return saboteur();
	switch (neighbor_type(c))
	{
		case ONE_CORNER: return mwatch(mdec_one_corner(c));
		case ONE_EDGE: return mwatch(mdec_one_edge(c));
		case EE_BENT: return mwatch(mdec_ee_bent(c));
		case EE_STRAIGHT: return mwatch(mdec_ee_straight(c));
		case EC_LEFT: return mwatch(mdec_ec_left(c));
		case EC_RIGHT: return mwatch(mdec_ec_right(c));
		case EC_SPAWN: return mwatch(mdec_ec_spawn(c));
		case THREE_MARCH: return mwatch(mdec_three_march(c));
		case THREE_STAND: return mwatch(mdec_three_stand(c));
		case THREE_RECOVER: return mwatch(mdec_three_recover(c));
		case THREE_UNSTAND: return mwatch(mdec_three_unstand(c));
		case THREE_HANG: return mwatch(mdec_three_hang(c));
		case THREE_UNHANG: return mwatch(mdec_three_unhang(c));
		case FOUR_Z: return mwatch(mdec_four_z(c));
		case FOUR_STAIRS: return mwatch(mdec_four_stairs(c));
		default: return saboteur();
	}
	
}

