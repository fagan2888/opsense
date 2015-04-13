package edu.nyu.vgc.opsense.elasticsearch;

import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.Scanner;

import com.google.common.base.Optional;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.optimaize.langdetect.LanguageDetector;
import com.optimaize.langdetect.LanguageDetectorBuilder;
import com.optimaize.langdetect.ngram.NgramExtractors;
import com.optimaize.langdetect.profiles.*;
import com.optimaize.langdetect.text.CommonTextObjectFactories;
import com.optimaize.langdetect.text.TextObject;
import com.optimaize.langdetect.text.TextObjectFactory;
@SuppressWarnings("serial")
public class MyWorldFixer extends Fixer {

	
	JsonObject countries;
	JsonObject countries2;
	JsonObject groups;
	JsonObject countries_groups;
	Map<String, String> numbe_to_code = new HashMap<>();
	
	Map<Object, Object> education = new HashMap(){{
		put("1","Some primary");
		put("2","Finished primary");
		put("3","Some secondary");
		put("4","Finished secondary");
	}};
	
	Map<Object, Object> priority = new HashMap(){{
		put("100","Action taken on climate change");
		put("101","Better transport and roads");
		put("102","Support for people who can't work");
		put("103","Access to clean water and sanitation");
		put("104","Better healthcare");
		put("105","A good education");
		put("106","A responsive government we can trust");
		put("107","Phone and internet access");
		put("108","Reliable energy at home");
		put("109","Affordable and nutritious food");
		put("110","Protecting forests, rivers and oceans");
		put("112","Political freedoms");
		put("111","Protection against crime and violence");
		put("113","Freedom from discrimination and persecution");
		put("114","Equality between men and women");
		put("115","Better job opportunities");
	}};
	Map<Object, Object> gender = new HashMap(){{
		put("1","Male");
		put("2","Female");
	}};
	
	Gson gson = new Gson();
	
	List<LanguageProfile> languageProfiles;
	LanguageDetector languageDetector;
	TextObjectFactory textObjectFactory;
	
	public MyWorldFixer() {
		super();
		String suportFilesDir = "/Volumes/Backup/Datasets/processText/";

		countries2 = openFile(suportFilesDir + "MyWorldCountryCodes.json");
		groups = openFile(suportFilesDir + "Myworld_Groups.json");
		countries_groups = openFile(suportFilesDir + "Myworld_CountryGroups.json");
		countries = openFile(suportFilesDir + "Myworld_Countries.json");
		
		
		countries.entrySet().forEach(e -> {
			
			String code = (countries2.entrySet().stream()
					.filter(es -> es.getValue().getAsString().equals(e.getValue().getAsString())) 
					.map(es -> es.getKey())
					.findFirst().get()
				);
			numbe_to_code.put(e.getKey(), code);
			
		});
		
		try {
			languageProfiles = new LanguageProfileReader().readAll();
			//build language detector:
			languageDetector = LanguageDetectorBuilder.create(NgramExtractors.standard())
			        .withProfiles(languageProfiles)
			        .build();

			textObjectFactory = CommonTextObjectFactories.forDetectingShortCleanText();

		} catch (IOException e1) {
			e1.printStackTrace();
		}

		
		
		
	}
	
	private String getLanguage(String text){
		TextObject textObject = textObjectFactory.forText(text);
		Optional<String> lang = languageDetector.detect(textObject);
		return lang.or("");
	}
	
	private JsonObject openFile(String file){
		try {
			Scanner sc = new Scanner(new File(file));
			sc.useDelimiter("\\Z");
			String line = sc.next();
			JsonObject object = gson.fromJson(line, JsonObject.class);
			sc.close();
			return object;
		} catch (Exception ex){
			ex.printStackTrace();
		}
		return null;
	}
	
	
	@Override
	public JsonObject fix(JsonObject object) {
		if(!isValid(object))
			return null;
		
		//Fix values
		object.add("country_group",getGroups(object.get("country"),'G'));
		object.add("country_income",getGroups(object.get("country"),'I'));
		
		replace(object,"country",countries);
		replace(object,"education",education);
		replace(object,"gender",gender);
		replace(object,"priority1",priority);
		replace(object,"priority2",priority);
		replace(object,"priority3",priority);
		replace(object,"priority4",priority);
		replace(object,"priority5",priority);
		replace(object,"priority6",priority);
		
		JsonObject result = new JsonObject();
		JsonObject entity = new JsonObject();
		JsonObject document = new JsonObject();
		JsonObject author = new JsonObject();
		
		entity.addProperty("id", currentLine);
		entity.addProperty("name", object.get("source").getAsString());
		entity.addProperty("partner_code", object.get("partner_code").getAsString());
		
		author.addProperty("id", currentLine);
		author.addProperty("gender",  object.get("gender").getAsString());
		author.addProperty("age",  object.get("age").getAsInt());
		author.addProperty("education",  object.get("education").getAsString());
		author.addProperty("country",  object.get("country").getAsString());
		author.add("country_group",  object.get("country_group"));
		author.add("country_income",  object.get("country_income"));
		
		document.addProperty("id", currentLine);
		document.addProperty("date", object.get("date").getAsString().substring(0, 10));
		
		JsonArray priorities = new JsonArray();
		for(int i=1; i<=6; i++){
			if(object.get("priority" +i).getAsString().length() > 0)
				priorities.add(object.get("priority" +i));
		}
		document.add("priorities", priorities);
		
		document.addProperty("text", object.get("vote_reason").getAsString());
		
		
		
		result.add("entity", entity);
		result.add("author", author);
		result.add("document", document);
		
		return result;
	}

	public JsonElement getGroups(JsonElement jsonElement, char type){
		String code = jsonElement.getAsString();
		String twoLetter = numbe_to_code.get(code);
		JsonArray groups1 = countries_groups.get(twoLetter).getAsJsonArray();
		JsonArray groupsResult = new JsonArray();
		for(int i=0; i < groups1.size(); i++){
			if(groups1.get(i).getAsString().charAt(0) == type)
				groupsResult.add(groups.get(groups1.get(i).getAsString()));
		}
		return groupsResult;
	}
	
	@Override
	public String getId(JsonObject object) {
		return "1";
	}
	
	public boolean isValid(JsonObject object){
		if(object.get("vote_reason").getAsString().length() ==  0)
			return false;
		
		if(!getLanguage(object.get("vote_reason").getAsString()).equals("en")){
			return false;
		}

		return true;
		
	}
}
