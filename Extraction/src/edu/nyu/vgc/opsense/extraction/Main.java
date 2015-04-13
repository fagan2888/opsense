package edu.nyu.vgc.opsense.extraction;


import org.apache.commons.lang3.time.StopWatch;


public class Main {
	public static void main(String[] args) {
		String tests[] = { "They really have not a good service to me with their delicious food" };
		Parser p = new Parser("/Users/cristian/Developer/models/nlp/");
		
		StopWatch total = new StopWatch();
		total.start();
		for(String test: tests){
			System.out.println("");
			System.out.println(test);
			System.out.println("==============================");
			p.selectRelationsByDistance(test,4).forEach(r -> System.out.println(r.gov().lemma() + "-" + r.dep().lemma()));
			System.out.println("==============================");
		}
		System.out.println("end");
		total.stop();
		System.out.println(total.getTime());
	}
}
