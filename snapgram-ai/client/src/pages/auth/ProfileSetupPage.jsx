import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";

const ProfileSetupPage = () => {
  return (
    <Card glass className="w-full mt-6 rounded-[28px] border-white/14 shadow-[0_24px_60px_rgba(50,6,5,0.4)]">
      <CardHeader>
        <CardTitle className="hero-text text-3xl">ProfileSetup</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-text-secondary">This is the placeholder for the ProfileSetup page.</p>
      </CardContent>
    </Card>
  );
};

export default ProfileSetupPage;
