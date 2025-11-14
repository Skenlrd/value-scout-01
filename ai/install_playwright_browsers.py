import asyncio
from playwright._impl._driver.driver import install, compute_driver_executable

async def run():
    driver = compute_driver_executable()
    await install(driver, browser_type="chromium")

asyncio.run(run())
