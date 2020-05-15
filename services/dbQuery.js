
module.exports ={
	create:async(model,query,cb)=>{
		model.create(query,(err,data)=>{
			if(err){
				console.log("error on create query================",err)
				cb({status: 0, message: 'Error in creating',error:err})
			}
			else{
				cb({status: 1, data: data})	
			}
		})
	},
	findOne:async(model,condition,fields,cb)=>{
		model.findOne(condition,fields,(err,data)=>{
			if(err){
				console.log("error on findOne query================",err)
				cb({status: 0, message: 'Error in updating', error:err})
			}
			else{
				cb({status: 1, data: data})	
			}
		})
	},
	find:async(model,condition,fields,options,cb)=>{
		let arr=[{"$match": condition}];
		if(options.userId) arr.push({$lookup:
							            {
							               from: "users",
							               localField: 'from',
							               foreignField: '_id',
							               as: "userData"
							            }
									})
		if(options.senderId) arr.push({$lookup:
							            {
							               from: "users",
							               localField: 'to',
							               foreignField: '_id',
							               as: "userData1"
							            }
									})
		if (options.sort) arr.push({$sort:{createdAt:-1}});
		 arr.push({ "$project": fields});
		//console.log(JSON.stringify(arr))
		model.aggregate(
			arr
			,(err,data)=>{
			if(err){
				console.log("error on find query================",err)
				cb({status: 0, message: 'Error in updating',error:err})
			}
			else{
				cb({status: 1, data: data})	
			}
		})
	},
	findAll:async(model,condition,fields,cb)=>{
		model.find(condition,fields,{lean:true},(err,data)=>{
			if(err){
				console.log("error on findAll query================",err)
				cb({status: 0, error:err})
			}
			else{
				cb({status: 1, data: data})	
			}
		})
	},
}