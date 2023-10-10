import * as cloudflare from "@pulumi/cloudflare";
import * as purrl from "@pulumiverse/purrl";
import { Resource } from "@pulumi/pulumi";

export class CloudflareRecords {
  private zoneId: Promise<string>;

  constructor(protected provider: cloudflare.Provider) {
    this.zoneId = cloudflare
      .getZone({ name: "zed.gay" }, { provider })
      .then((z) => z.zoneId);
  }

  build(): Resource[] {
    const { provider, zoneId } = this;

    const currentIpAddressQuery = new purrl.Purrl("ip_address", {
      name: "ip_address",
      url: "https://api.ipify.org/",
      method: "GET",
      responseCodes: ["200"],
    });
    return [
      new cloudflare.Record(
        "external_domain",
        {
          type: "A",
          name: "external",
          value: currentIpAddressQuery.response,
          zoneId,
        },
        { provider },
      ),
    ];
  }
}
