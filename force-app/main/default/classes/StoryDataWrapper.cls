public class StoryDataWrapper {
public String Team { get; set; }
    public String Release { get; set; }
    public String Env { get; set; }
    public DateTime LastModifiedDate { get; set; }
    public String Dev { get; set; }
    public String ust { get; set; }

    public StoryDataWrapper(String Team, String Release, String Env, DateTime LastModifiedDate, String Dev, String ust) {
        this.Team = Team;
        this.Release = Release;
        this.Env = Env;
        this.LastModifiedDate = LastModifiedDate;
        this.Dev = Dev;
        this.ust = ust;
    }
}