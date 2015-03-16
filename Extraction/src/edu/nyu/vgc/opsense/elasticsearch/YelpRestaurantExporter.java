package edu.nyu.vgc.opsense.elasticsearch;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

@SuppressWarnings("serial")
public class YelpRestaurantExporter extends MongoExporter {
	public YelpRestaurantExporter(){
		dataset = "Yelp";
		entities = "_business";
		documents = "_review";
		authors = "_user";
		output = "/Volumes/Backup/Datasets/processText/YelpRestaurant_fixed.json";
	}
	
	
	@Override
	public int entityLimit() { return Integer.MAX_VALUE; }
	
	@Override
	public int documentLimit() { return 50; }
	
	@Override
	public String docEntityId() { return "business_id"; }

	@Override
	public String docAuthorId() { return "user_id";	}
	
	@Override
	public String entityId() { return "business_id";	}
	
	@Override
	public String authorId() { return "user_id";}
	@Override
	public String docId() { return "review_id"; }
	
	@Override
	public DBObject getEntityFilter() {
		DBObject filter = new BasicDBObject();
		filter.put("categories", new BasicDBObject("$in", new String[] {"Restaurants", "Food"} ));
		return filter;
	}
	
	public JsonElement sum(JsonObject obj, String field){
		JsonElement votes;
		try{
			votes = obj.get(field).getAsJsonObject().entrySet().stream().reduce((o,n) -> {
				JsonPrimitive p = new JsonPrimitive(n.getValue().getAsInt()+o.getValue().getAsInt());
				o.setValue(p);
				return o;
				}).map(o -> o.getValue()).get();
		}catch (Exception ex){
			return new JsonPrimitive(0);
		}
		
		return votes;
	}
	
	public JsonElement sum(JsonElement obj){
		JsonElement votes;
		try{
			votes = obj.getAsJsonObject().entrySet().stream().reduce((o,n) -> {
				JsonPrimitive p = new JsonPrimitive(n.getValue().getAsInt()+o.getValue().getAsInt());
				o.setValue(p);
				return o;
				}).map(o -> o.getValue()).get();
		}catch (Exception ex){
			return new JsonPrimitive(0);
		}
		
		return votes;
	}
	
	
	
	public JsonObject processDocument(DBObject dbEntity, DBObject dbAuthor,	DBObject dbDocument) {
		JsonObject result = new JsonObject();
		
		JsonObject document = dbObjectToJson(dbDocument);
		if(document.get("text") == null || document.get("text").getAsString().length() == 0)
			return null;
		
		JsonObject entity = dbObjectToJson(dbEntity);
		JsonObject author = dbObjectToJson(dbAuthor);
		
		result.add("entity", entity);
		result.add("author", author);
		result.add("document", document);
				
		author.addProperty("friends", author.get("friends").getAsJsonArray().size());
		author.add("votes", sum(author, "votes"));
		author.add("compliments", sum(author, "compliments"));
		author.addProperty("elite", author.get("elite").getAsJsonArray().size());

		List<String> remove = new LinkedList<String>() {{
			add("entity._id");
			add("entity.open");
			add("entity.review_count");
			add("entity.stars");
			add("entity.type");
			add("entity.hours");
			add("entity.attributes");
						
			add("author._id");
			add("author.review_count");
			add("author.type");
			
			add("document._id");
			add("document.user_id");
			add("document.type");
			add("document.business_id");
		}};
		
		HashMap<String,String> rename = new HashMap<String,String>() {{
			put("entity.business_id", "id");
			
			put("author.user_id", "id");
			put("author.average_stars", "user_avg_stars");
			
			put("document.review_id", "id");
		}};
		
		Utils.rename(result, rename);
		Utils.remove(result, remove);
		
		return result;
	}
}
