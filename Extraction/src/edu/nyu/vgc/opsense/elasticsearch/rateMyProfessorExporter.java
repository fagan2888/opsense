package edu.nyu.vgc.opsense.elasticsearch;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import com.google.gson.JsonObject;
import com.mongodb.DBObject;

@SuppressWarnings("serial")
public class rateMyProfessorExporter extends MongoExporter {
	public rateMyProfessorExporter(){
		dataset = "rateMyProfessor";
		entities = "professors";
		documents = "reviews";
		output = "/Volumes/Backup/Datasets/processText/rateMyProfessor_fixed.json";
	}
	
	
	@Override
	public int entityLimit() { return Integer.MAX_VALUE; }
	
	@Override
	public int documentLimit() { return Integer.MAX_VALUE; }
	
	@Override
	public String docEntityId() { return "tid";	}

	@Override
	public String docAuthorId() {return null;}
	
	@Override
	public JsonObject processDocument(DBObject dbEntity, DBObject dbAuthor,	DBObject dbDocument) {
		JsonObject result = new JsonObject();
		
		//Document
		JsonObject document = dbObjectToJson(dbDocument);
		if(document.get("rComments") == null || document.get("rComments").getAsString().length() == 0)
			return null;
		//Professor
		JsonObject entity = dbObjectToJson(dbEntity);
		//Author
		JsonObject author = new JsonObject();
		
		result.add("entity", entity);
		result.add("author", author);
		result.add("document", document);
		
		entity.addProperty("name", 
				entity.get("tFname").getAsString() + " " +  
				entity.get("tLname").getAsString());
		
		document.addProperty("AvgRating", 
				(document.get("rClarity").getAsNumber().floatValue() + 
						document.get("rHelpful").getAsNumber().floatValue())/2);
		
		document.addProperty("rDate", Utils.fixDate(document.get("rDate").getAsString(), "mm/dd/yyyy"));
		
		author.addProperty("id", "_");
		author.add("onlineClass", document.get("onlineClass"));
		author.add("class", document.get("rClass"));
		author.add("interest", document.get("rInterest"));
		author.add("takenForCredit", document.get("takenForCredit"));
		author.add("grade", document.get("teacherGrade"));
		
		
		
		List<String> remove = new LinkedList<String>() {{
			add("entity.tSid");
			add("entity.contentType");
			add("entity.categoryType");
			add("entity.overall_rating");
			add("entity.lastPage");
			add("entity.remaining");
			add("entity.tFname");
			add("entity.tLname");
			add("entity.tNumRatings");
			add("entity.rating_class");
			add("entity.tid");
			
			add("document.clarityColor");
			add("document.easyColor");
			add("document.helpColor");
			add("document.sId");
			add("document.quality");
			add("document.unUsefulGrouping");
			add("document.usefulGrouping");
			add("document.tid");
			add("document._id");
			add("document.rStatus");
			add("document.onlineClass");
			add("document.rClass");
			add("document.rInterest");
			add("document.takenForCredit");
			add("document.teacherGrade");
		}};
		
		HashMap<String,String> rename = new HashMap<String,String>() {{
			put("entity._id", "id");
			put("entity.tDept", "Department");
			put("entity.institution_name", "Institution");
			
			put("document.helpCount", "votes_help");
			put("document.notHelpCount", "votes_no_help");
			put("document.rClarity", "rating_Clarity");
			put("document.rEasy", "rating_Easiness");
			put("document.rHelpful", "rating_Helpful");
			put("document.AvgRating", "rating_Avg");
			put("document.rComments", "text");
			put("document.rDate", "date");
			put("document.rComments", "text");
			put("document.rTextBookUse", "textBook");
			put("document.teacherRatingTags", "tags");
		}};
		
		
		
		
		Utils.rename(result, rename);
		Utils.remove(result, remove);
		
		return result;
	}
}




















