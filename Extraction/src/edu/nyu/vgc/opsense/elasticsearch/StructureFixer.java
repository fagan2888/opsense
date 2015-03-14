package edu.nyu.vgc.opsense.elasticsearch;

import java.io.BufferedWriter;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Stream;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.lang3.time.StopWatch;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSerializer;

public class StructureFixer {
	public String source;
	public String fixerName;
	public int skip = 0;
	public int limit = Integer.MAX_VALUE;
	StopWatch timer = new StopWatch();
	Fixer fixer;
	
	public boolean testMode = false;
	public String type = "json";
	Gson gson = new Gson();
	
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
			sf.source = "/Volumes/Backup/Datasets/processText/MYWorld_votes_all.csv";
			sf.fixerName = "MyWorld";
			sf.skip = 0;
			sf.limit = Integer.MAX_VALUE;
			sf.type = sf.extension();
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
			parts[parts.length-1] = "json";
			output = String.join(".", parts);
		}

		return output;
	}
	
	public String extension(){
		if(this.output == null){
			String[] parts = this.source.split("\\.");
			return parts[parts.length-1].toLowerCase();
		}

		return output;
	}
	
	public void go(){
		timer.start();
		if(type.equals("json"))
			processJSON();
		else if(type.equals("csv"))
			processCSV();
		timer.stop();
		
	}
	
	public void processCSV(){
		FileReader in;
		try {
			System.out.println("Starting");
			in = new FileReader(this.source);
			Iterable<CSVRecord> records = CSVFormat.EXCEL.withHeader().parse(in);
			int count = 0;
			
			for(CSVRecord record: records){
				count++;
				if(count > this.limit){
					return;
				}
				String json = gson.toJson(record.toMap());
				processJsonLine(json, count);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		
	}
	
	public String processJsonLine(String line, int lineNumber){
		fixer.currentLine = lineNumber;
		return processJsonLine(line);
	}
	
	public String processJsonLine(String line){
		JsonObject object = gson.fromJson(line, JsonObject.class);
		String id =	fixer.getId(object);
		object = fixer.fix(object);
		writeToFile(object);
		return id;
	}
	
	public void processJSON(){
		Integer[] count = new Integer[1];
		count[0] = 0;
		Path path = Paths.get(this.source); 
		long total = getLineCount();
		long[] totalArr = {total > limit ? limit : total};
		System.out.println("Wrting to:" + output());

		try (Stream<String> lines = Files.lines(path, Charset.defaultCharset())) {
			  lines.skip(this.skip).limit(this.limit).forEach(line -> {
			  count[0]++;
			  String id = processJsonLine(line);
				printStats(count[0], totalArr[0], id);
			  });
		} catch (Exception ex){
			ex.printStackTrace();
			System.err.println("Line: " + count[0] + "\n" + ex.getMessage());
		}
	}
	
		
	public void writeToFile(JsonObject object){
		if(object != null){
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
