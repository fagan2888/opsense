package edu.nyu.vgc.opsense.elasticsearch;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang3.time.StopWatch;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSerializer;

public class Utils {
	public static void printJson(String s){
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        JsonParser jp = new JsonParser();
        JsonElement je = jp.parse(s);
        String prettyJsonString = gson.toJson(je);
        print(prettyJsonString);
    }
    
	public static void print(Object obj){
        System.out.println(obj);
    }
   
     public static void printJson(Object s){
         printJson(s.toString());
     }
     
     public static void printJson(JsonSerializer s){
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String prettyJsonString = gson.toJson(s);
        print(prettyJsonString);
     }
     
     public static void printJson(List<JsonSerializer> s){
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String prettyJsonString = gson.toJson(s);
        print(prettyJsonString);
     }
     
     

 	public static JsonObject rename(JsonObject jo, Map<String, String> map){
 		map.forEach((k,v) ->{
 			JsonObject obj = getParent(jo, k);
 			String[] fs = k.split("\\.");
 			JsonElement value = obj.remove(fs[fs.length-1]);
 			obj.add(v, value);
 		});
 		return jo;
 		
 	}
 	
 	public static JsonObject replace(JsonObject obj, String field, Map<Object, Object> map){
 		Object currValue=null;
 		for(Object j: map.keySet()){
 			currValue = j;
 			break;
 		}
 		Object res = getEqualType(obj, currValue, field);
 		add(obj, field, map.get(res));
 		return obj;
 	}
 	
 	
 	public static Object getEqualType(JsonObject obj, Object value, String field){
 		if (value instanceof String) {
 			return obj.get(field).getAsString();
 		} 
 		else if (value instanceof Boolean) {
 			return obj.get(field).getAsBoolean();
 		} 
 		else if (value instanceof Double) {
 			return obj.get(field).getAsDouble();
 		} 
 		else if (value instanceof Float) {
 			return obj.get(field).getAsFloat();
 		}
 		else if (value instanceof Integer) {
 			return obj.get(field).getAsInt();
 		}
 		else if (value instanceof Long) {
 			return obj.get(field).getAsLong();
 		}
 		else if (value instanceof Short) {
 			return obj.get(field).getAsShort();
 		}
 		
 		if (value instanceof Number) {
 			return obj.get(field).getAsNumber();
 		}

 		if (value instanceof Character) {
 			return obj.get(field).getAsCharacter();
 		}
 		else {
 			return obj.get(field).toString();
 		} 
 	}
 	
 	public static JsonObject add(JsonObject jo, Map<String, Object> map){
 		map.forEach((k,v) ->{
 			JsonObject obj = getParent(jo, k);
 			String[] fs = k.split("\\.");
 			add(obj, fs[fs.length-1], v);
 		});
 		return jo;
 	}
 	
 	public static JsonObject add(JsonObject jo, String name, Object value){
 		if (value instanceof Number) {
 			jo.addProperty(name, (Number)value);
 		} else if (value instanceof Character) {
 			jo.addProperty(name, (Character)value);
 		} else if (value instanceof Boolean) {
 			jo.addProperty(name, (Boolean)value);
 		} else {
 			if(value == null){
 				jo.addProperty(name,new String());
 			}
 			else
 				jo.addProperty(name, value.toString());
 		} 
 		return jo;
 	}
 	
 	public static JsonObject remove(JsonObject jo, Map<String, String> map){
 		map.forEach((k,v) ->{
 			remove(jo,k);
 		});
 		return jo;	
 	}
 	
 	public static JsonObject remove(JsonObject jo, List<String> list){
 		list.forEach(k ->{
 			remove(jo,k);
 		});
 		return jo;	
 	}
 	
 	public  static String fixDate(String dateOriginal, String format){
 		SimpleDateFormat dt = new SimpleDateFormat(format); 		
 		try {
 			Date date;
 			date = dt.parse(dateOriginal);
 			SimpleDateFormat dt1 = new SimpleDateFormat("yyyy-mm-dd");
 			return (dt1.format(date));
 		} catch (ParseException e) {
 			// TODO Auto-generated catch block
 			e.printStackTrace();
 		} 
 		return dateOriginal;
 		
 	}
 	
 	public static JsonObject get(JsonObject jo, String k){
 		String[] fs = k.split("\\.");
 		JsonObject obj2 = jo;
 		for(int i =0; i < fs.length; i++){
 			obj2 = obj2.getAsJsonObject(fs[i]);
 		}
 		return obj2;
 	}
 	
 	public static JsonObject getParent(JsonObject jo, String k){
 		String[] fs = k.split("\\.");
 		JsonObject obj2 = jo;
 		for(int i=0; i < fs.length-1; i++){
 			obj2 = obj2.getAsJsonObject(fs[i]);
 		}
 		return obj2;
 	}
 	
 	public static JsonObject remove(JsonObject jo, String k){
 		String[] fs = k.split("\\.");
 		JsonObject obj2 = jo;
 		for(int i =0; i < fs.length-1; i++){
 			obj2 = obj2.getAsJsonObject(fs[i]);
 		}
 		obj2.remove(fs[fs.length-1]);
 		return obj2;
 	}
     
 	public static void printStats(int count, String id, StopWatch timer){
		System.out.println(
				String.format("%10s", count) +
				String.format("%30s", id) +
				String.format("%20s", timer.getTime()) +
				String.format("%20s", timer.getTime()/count) 
				
		);
	}
	
	public static void printStats(int count, long total, String id, StopWatch timer){
		System.out.println(
				String.format("%10s", count) +
				String.format("%10s", total) +
				String.format("%10s", Math.floor(count*1.0/total*100)) + "%" +
				String.format("%30s", id) +
				String.format("%20s", timer.getTime()) +
				String.format("%20s", timer.getTime()*1.0/count) 
				
		);
	}
}
