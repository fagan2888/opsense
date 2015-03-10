package edu.nyu.vgc.opsense.elasticsearch;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringReader;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.stream.Stream;

import org.apache.commons.lang3.time.StopWatch;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSerializer;
import com.mongodb.DBObject;

public class StructureFixer {
	public String source;
	public String fixerName;
	public int skip = 0;
	public int limit = Integer.MAX_VALUE;
	StopWatch timer = new StopWatch();
	Fixer fixer;
	
	public boolean testMode = false;
	
	public static void main(String args[]) throws ClassNotFoundException, InstantiationException, IllegalAccessException{	
		if(args.length == 1 && args[0].equals("help")){
			System.out.println("usage: source fixer skip limit");
		}
		
		StructureFixer sf = new StructureFixer();
		if(args.length > 1){
			sf.source =  args[0];
			sf.fixerName = args[1];
			if(args.length > 2){
				sf.skip = Integer.parseInt(args[3]);
				sf.limit = Integer.parseInt(args[4]);
			}
		}else{
			sf.source = "/Volumes/Backup/Datasets/processText/zocDoc.json";
			sf.fixerName = "ZocDoc";
			sf.skip = 0;
			sf.limit = Integer.MAX_VALUE;
		}
		
		Class<?> clazz = Class.forName("edu.nyu.vgc.opsense.elasticsearch." + sf.fixerName + "Fixer");
		sf.fixer = (Fixer)clazz.newInstance();

		sf.go();
	}
	private String output;
	
	public String output(){
		if(this.output == null){
			String[] parts = this.source.split("\\.");
			parts[parts.length-2] += "_fixed";
			output = String.join(".", parts);
		}

		return output;
	}
	
	public void go(){
		Integer[] count = new Integer[1];
		count[0] = 0;
		Path path = Paths.get(this.source); 
		long total = getLineCount();
		long[] totalArr = {total > limit ? limit : total};
		System.out.println("Wrting to:" + output());
		Gson gson = new Gson();
		timer.start();
		try (Stream<String> lines = Files.lines(path, Charset.defaultCharset())) {
			  lines.skip(this.skip).limit(this.limit).forEach(line -> {

				JsonObject object = gson.fromJson(line, JsonObject.class);
				String id =	fixer.getId(object);
				count[0]++;
				printStats(count[0], totalArr[0], id);
				object = fixer.fix(object);
				writeToFile(object);
			  });
		} catch (Exception ex){
			ex.printStackTrace();
			System.err.println("Line: " + count[0] + "\n" + ex.getMessage());
		}
		timer.stop();
		
	}
	
		
	public void writeToFile(JsonObject object){
		if(testMode){
			printJson(object);
		} else {
			
			try(PrintWriter out = new PrintWriter(new BufferedWriter(new FileWriter(this.output(), true)))) {
				out.println(object.toString());
			} catch (Exception ex){
				ex.printStackTrace();
			}
		}
	}

	public long getLineCount(){
		Path path = Paths.get(this.source);
		try {
			return Files.lines(path, Charset.defaultCharset()).count();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return -1;
	}
	public void printJson(String s){
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        JsonParser jp = new JsonParser();
        JsonElement je = jp.parse(s);
        String prettyJsonString = gson.toJson(je);
        print(prettyJsonString);
    }
    
	public void print(Object obj){
        System.out.println(obj);
    }
   
     public void printJson(Object s){
         printJson(s.toString());
     }
     
     public void printJson(JsonSerializer s){
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String prettyJsonString = gson.toJson(s);
        print(prettyJsonString);
     }
     
     public void printJson(List<JsonSerializer> s){
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String prettyJsonString = gson.toJson(s);
        print(prettyJsonString);
     }
	
	public void printStats(int count, long total, String id){
		System.out.println(
				String.format("%10s", count) +
				String.format("%10s", total) +
				String.format("%10s", Math.floor(count*1.0/total*100)) + "%" +
				String.format("%30s", id) +
				String.format("%20s", timer.getTime()) +
				String.format("%20s", timer.getTime()/count) 
				
		);
	}
	
	
}
