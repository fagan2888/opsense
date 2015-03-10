package edu.nyu.vgc.opsense.extraction;


import org.apache.commons.lang3.time.StopWatch;


public class Main {
	public static void main(String[] args) {
		String tests[] = {
				"Richard is beautiful", 
				"The good food",
				"My father is a nice guy",
				"She sleeps.",
				"She sleeps soundly.",
				"She sleeps on the sofa",
				"She sleeps every afternoon.",
				"She is sleeping right now.",
				"Mary will sleep later.",
				"The dogs are sleeping in the garage.",
				"The flowers looked wilted",
				"The spaghetti sauce tasted delicious",
				"She tasted the delicious spaghetti sauce",
				"I can see that they rely on this and that",
				"That was the worst experience of my life",
				"the man in the corner taught his dog to play golf",
				"Nor the food neither the service was good",
				"I don't like this place",
				"What she said makes sense"
			};
		//String tests[] = { "They really have not a good service to me with their delicious food" };
		Parser p = new Parser();
		
		StopWatch total = new StopWatch();
		total.start();
		for(String test: tests){
			System.out.println("");
			System.out.println(test);
			System.out.println("==============================");
			p.selectRelations(test).forEach(r -> System.out.println(r.gov().lemma() + "-" + r.dep().lemma()));
			System.out.println("==============================");
		}
		System.out.println("end");
		total.stop();
		System.out.println(total.getTime());
	}
}
